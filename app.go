package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"
	"time"

	"os/exec"

	"github.com/Jguer/go-alpm/v2"
)

var h *alpm.Handle

// var dbs []alpm.IDB
var dbs []alpm.IDB

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	// Perform your setup here
	a.ctx = ctx

	var err error
	h, err = alpm.Initialize("/", "/var/lib/pacman")
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to initialize alpm: %v\n", err)
		os.Exit(1)
	}

	// Register and sync repositories
	repos := []string{"core", "extra"}
	for _, repo := range repos {
		db, err := h.RegisterSyncDB(repo, 0)
		if err != nil {
			fmt.Printf("Error getting sync db for %s: %v\n", repo, err)
			return
		}
		dbs = append(dbs, db)
	}
}

// domReady is called after front-end resources have been loaded
func (a App) domReady(ctx context.Context) {
	// Add your action here
}

// beforeClose is called when the application is about to quit,
// either by clicking the window close button or calling runtime.Quit.
// Returning true will cause the application to continue, false will continue shutdown as normal.
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	return false
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	// Perform your teardown here
	if h != nil {
		h.Release()
	}
}

type PackageInfo struct {
	Name        string   `json:"name"`
	Version     string   `json:"version"`
	Description string   `json:"description"`
	Repository  string   `json:"repository"`
	Maintainer  string   `json:"maintainer"`
	UpstreamURL string   `json:"upstreamurl"`
	DependList  []string `json:"dependlist"`
	LastUpdated string   `json:"lastupdated"`
}

func (a *App) SearchPackage(query string) []PackageInfo {
	var results []PackageInfo
	var wg sync.WaitGroup
	resultChan := make(chan PackageInfo, 100)
	doneChan := make(chan bool)

	// Start a goroutine to collect results
	go func() {
		for pkg := range resultChan {
			results = append(results, pkg)
		}
		doneChan <- true
	}()

	// Search official repositories concurrently
	for _, db := range dbs {
		wg.Add(1)
		go func(db alpm.IDB) {
			defer wg.Done()
			searchDB(db, query, resultChan)
		}(db)
	}

	// Search AUR concurrently
	wg.Add(1)
	go func() {
		defer wg.Done()
		searchAUR(query, resultChan)
	}()

	// Wait for all searches to complete
	wg.Wait()
	close(resultChan)

	// Wait for result collection to finish
	<-doneChan

	return results
}

func searchDB(db alpm.IDB, query string, resultChan chan<- PackageInfo) {
	db.PkgCache().ForEach(func(pkg alpm.IPackage) error {
		if strings.Contains(strings.ToLower(pkg.Name()), strings.ToLower(query)) {
			lastUpdated := pkg.BuildDate().UTC().Format("Jan. 2, 2006, 3 p.m. MST")
			resultChan <- PackageInfo{
				Name:        pkg.Name(),
				Version:     pkg.Version(),
				Description: pkg.Description(),
				Repository:  db.Name(),
				Maintainer:  pkg.Packager(),
				UpstreamURL: pkg.URL(),
				DependList:  convertDependList(pkg.Depends()),
				LastUpdated: lastUpdated,
			}
		}
		return nil
	})
}

func searchAUR(query string, resultChan chan<- PackageInfo) {
	cmd := exec.Command("curl", "-s", fmt.Sprintf("https://aur.archlinux.org/rpc/?v=5&type=search&arg=%s", query))
	output, err := cmd.Output()
	if err != nil {
		fmt.Printf("Error searching AUR: %v\n", err)
		return
	}

	var aurResponse struct {
		Results []struct {
			Name         string `json:"Name"`
			Version      string `json:"Version"`
			Description  string `json:"Description"`
			Maintainer   string `json:"Maintainer"`
			URL          string `json:"URL"`
			LastModified int64  `json:"LastModified"`
		} `json:"results"`
	}
	err = json.Unmarshal(output, &aurResponse)
	if err != nil {
		fmt.Printf("Error parsing AUR response: %v\n", err)
		return
	}

	for _, aurPkg := range aurResponse.Results {
		lastUpdated := time.Unix(aurPkg.LastModified, 0).UTC().Format("02-01-2006")
		resultChan <- PackageInfo{
			Name:        aurPkg.Name,
			Version:     aurPkg.Version,
			Description: aurPkg.Description,
			Repository:  "AUR",
			Maintainer:  aurPkg.Maintainer,
			UpstreamURL: aurPkg.URL,
			DependList:  nil,
			LastUpdated: lastUpdated,
		}
	}
}

func convertDependList(depList alpm.IDependList) []string {
	var deps []string
	depList.ForEach(func(dep *alpm.Depend) error {
		deps = append(deps, dep.Name)
		return nil
	})
	return deps
}

type InstalledPackage struct {
	Name        string `json:"name"`
	Version     string `json:"version"`
	Repository  string `json:"repository"`
	LastUpdated string `json:"lastupdated"`
}

func (a *App) GetInstalledPackages() ([]InstalledPackage, error) {
	if h == nil {
		return nil, fmt.Errorf("ALPM handle is not initialized")
	}

	db, err := h.LocalDB()
	if err != nil {
		return nil, fmt.Errorf("failed to get local DB: %v", err)
	}

	var packages []InstalledPackage
	var mutex sync.Mutex

	err = db.PkgCache().ForEach(func(pkg alpm.IPackage) error {
		mutex.Lock()
		packages = append(packages, InstalledPackage{
			Name:        pkg.Name(),
			Version:     pkg.Version(),
			Repository:  db.Name(),
			LastUpdated: pkg.BuildDate().UTC().Format("Jan. 2, 2006, 3 p.m. MST"),
		})
		mutex.Unlock()
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("error iterating over packages: %v", err)
	}

	if len(packages) == 0 {
		return nil, fmt.Errorf("no installed packages found")
	}

	return packages, nil
}

func (a *App) UninstallPackage(packageName string) error {
	if h == nil {
		return fmt.Errorf("ALPM handle is not initialized")
	}

	db, err := h.LocalDB()
	if err != nil {
		return fmt.Errorf("failed to get local DB: %v", err)
	}

	pkg := db.Pkg(packageName)
	if pkg == nil {
		return fmt.Errorf("package %s is not installed", packageName)
	}

	cmd := exec.Command("sh", "-c", fmt.Sprintf("pkexec yay -Rdd --noconfirm %s", packageName))
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Fatal("Error: ", err)
	}
	fmt.Println(string(output))

	return nil
}

func (a *App) SearchLocalPackage(pkg string) (bool, error) {
	if pkg == "" {
		return false, fmt.Errorf("empty package name provided")
	}

	local, err := searchLocalDB(pkg)
	if err != nil {
		return false, fmt.Errorf("error searching local DB: %w", err)
	}

	if local == nil {
		return false, nil
	}

	return strings.Contains(strings.ToLower(local.Name()), strings.ToLower(pkg)), nil
}

func searchLocalDB(pkg string) (alpm.IPackage, error) {
	if h == nil {
		return nil, fmt.Errorf("ALPM handle is not initialized")
	}

	db, err := h.LocalDB()
	if err != nil {
		return nil, fmt.Errorf("failed to get local DB: %w", err)
	}

	res := db.Pkg(pkg)
	return res, nil
}

func (a *App) InstallApp(pkg string) {
	cmd := exec.Command("sh", "-c", fmt.Sprintf("pkexec yay -S --noconfirm %s", pkg))
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Fatal("Error: ", err)
	}
	fmt.Println(string(output))
}
