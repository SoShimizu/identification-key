export namespace engine {
	
	export class ContinuousValue {
	    min: number;
	    max: number;
	
	    static createFrom(source: any = {}) {
	        return new ContinuousValue(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.min = source["min"];
	        this.max = source["max"];
	    }
	}
	export class Taxon {
	    id: string;
	    name: string;
	    traits: Record<string, number>;
	    continuousTraits: Record<string, ContinuousValue>;
	    categoricalTraits: Record<string, Array<string>>;
	    description?: string;
	    references?: string;
	    images?: string[];
	
	    static createFrom(source: any = {}) {
	        return new Taxon(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.traits = source["traits"];
	        this.continuousTraits = this.convertValues(source["continuousTraits"], ContinuousValue, true);
	        this.categoricalTraits = source["categoricalTraits"];
	        this.description = source["description"];
	        this.references = source["references"];
	        this.images = source["images"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Trait {
	    id: string;
	    name: string;
	    group: string;
	    type: string;
	    parent?: string;
	    state?: string;
	    difficulty?: number;
	    risk?: number;
	    helpText?: string;
	    helpImages?: string[];
	    minValue?: number;
	    maxValue?: number;
	    isInteger?: boolean;
	    states?: string[];
	
	    static createFrom(source: any = {}) {
	        return new Trait(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.group = source["group"];
	        this.type = source["type"];
	        this.parent = source["parent"];
	        this.state = source["state"];
	        this.difficulty = source["difficulty"];
	        this.risk = source["risk"];
	        this.helpText = source["helpText"];
	        this.helpImages = source["helpImages"];
	        this.minValue = source["minValue"];
	        this.maxValue = source["maxValue"];
	        this.isInteger = source["isInteger"];
	        this.states = source["states"];
	    }
	}
	export class Matrix {
	    name: string;
	    traits: Trait[];
	    taxa: Taxon[];
	
	    static createFrom(source: any = {}) {
	        return new Matrix(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.traits = this.convertValues(source["traits"], Trait);
	        this.taxa = this.convertValues(source["taxa"], Taxon);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class StateProb {
	    state: string;
	    p: number;
	
	    static createFrom(source: any = {}) {
	        return new StateProb(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.state = source["state"];
	        this.p = source["p"];
	    }
	}
	
	export class TaxonScore {
	    index: number;
	    taxon: Taxon;
	    post: number;
	    delta: number;
	    used: number;
	    conflicts: number;
	    match: number;
	    support: number;
	
	    static createFrom(source: any = {}) {
	        return new TaxonScore(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.index = source["index"];
	        this.taxon = this.convertValues(source["taxon"], Taxon);
	        this.post = source["post"];
	        this.delta = source["delta"];
	        this.used = source["used"];
	        this.conflicts = source["conflicts"];
	        this.match = source["match"];
	        this.support = source["support"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class TraitSuggestion {
	    traitId: string;
	    name: string;
	    group: string;
	    ig: number;
	    max_ig: number;
	    ecr: number;
	    gini: number;
	    entropy: number;
	    pStates: StateProb[];
	    difficulty?: number;
	    risk?: number;
	    score: number;
	
	    static createFrom(source: any = {}) {
	        return new TraitSuggestion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.traitId = source["traitId"];
	        this.name = source["name"];
	        this.group = source["group"];
	        this.ig = source["ig"];
	        this.max_ig = source["max_ig"];
	        this.ecr = source["ecr"];
	        this.gini = source["gini"];
	        this.entropy = source["entropy"];
	        this.pStates = this.convertValues(source["pStates"], StateProb);
	        this.difficulty = source["difficulty"];
	        this.risk = source["risk"];
	        this.score = source["score"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace main {
	
	export class ApplyOptions {
	    defaultAlphaFP: number;
	    defaultBetaFN: number;
	    gammaNAPenalty: number;
	    kappa: number;
	    conflictPenalty: number;
	    toleranceFactor: number;
	    categoricalAlgo: string;
	    jaccardThreshold: number;
	    wantInfoGain: boolean;
	    usePragmaticScore: boolean;
	    recommendationStrategy: string;
	    lambda: number;
	    a0: number;
	    b0: number;
	    alphaFP?: Record<string, number>;
	    betaFN?: Record<string, number>;
	    confidence?: Record<string, number>;
	    priors?: Record<string, number>;
	
	    static createFrom(source: any = {}) {
	        return new ApplyOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.defaultAlphaFP = source["defaultAlphaFP"];
	        this.defaultBetaFN = source["defaultBetaFN"];
	        this.gammaNAPenalty = source["gammaNAPenalty"];
	        this.kappa = source["kappa"];
	        this.conflictPenalty = source["conflictPenalty"];
	        this.toleranceFactor = source["toleranceFactor"];
	        this.categoricalAlgo = source["categoricalAlgo"];
	        this.jaccardThreshold = source["jaccardThreshold"];
	        this.wantInfoGain = source["wantInfoGain"];
	        this.usePragmaticScore = source["usePragmaticScore"];
	        this.recommendationStrategy = source["recommendationStrategy"];
	        this.lambda = source["lambda"];
	        this.a0 = source["a0"];
	        this.b0 = source["b0"];
	        this.alphaFP = source["alphaFP"];
	        this.betaFN = source["betaFN"];
	        this.confidence = source["confidence"];
	        this.priors = source["priors"];
	    }
	}
	export class ApplyRequest {
	    selected: Record<string, number>;
	    selectedMulti: Record<string, Array<string>>;
	    selectedNA: Record<string, boolean>;
	    mode: string;
	    algo: string;
	    opts: ApplyOptions;
	
	    static createFrom(source: any = {}) {
	        return new ApplyRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.selected = source["selected"];
	        this.selectedMulti = source["selectedMulti"];
	        this.selectedNA = source["selectedNA"];
	        this.mode = source["mode"];
	        this.algo = source["algo"];
	        this.opts = this.convertValues(source["opts"], ApplyOptions);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ApplyResultEx {
	    scores: engine.TaxonScore[];
	    suggestions: engine.TraitSuggestion[];
	
	    static createFrom(source: any = {}) {
	        return new ApplyResultEx(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.scores = this.convertValues(source["scores"], engine.TaxonScore);
	        this.suggestions = this.convertValues(source["suggestions"], engine.TraitSuggestion);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class KeyInfo {
	    name: string;
	    path: string;
	    size: number;
	    ext: string;
	    modTime: string;
	
	    static createFrom(source: any = {}) {
	        return new KeyInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.size = source["size"];
	        this.ext = source["ext"];
	        this.modTime = source["modTime"];
	    }
	}

}

