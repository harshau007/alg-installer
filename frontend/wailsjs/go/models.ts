export namespace main {
	
	export class PackageInfo {
	    name: string;
	    version: string;
	    description: string;
	    repository: string;
	    maintainer: string;
	    upstreamurl: string;
	    dependlist: string[];
	    lastupdated: string;
	
	    static createFrom(source: any = {}) {
	        return new PackageInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.version = source["version"];
	        this.description = source["description"];
	        this.repository = source["repository"];
	        this.maintainer = source["maintainer"];
	        this.upstreamurl = source["upstreamurl"];
	        this.dependlist = source["dependlist"];
	        this.lastupdated = source["lastupdated"];
	    }
	}

}

