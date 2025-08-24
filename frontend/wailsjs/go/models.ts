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
	export class Dependency {
	    parentTraitId: string;
	    requiredState: string;
	
	    static createFrom(source: any = {}) {
	        return new Dependency(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.parentTraitId = source["parentTraitId"];
	        this.requiredState = source["requiredState"];
	    }
	}
	export class Taxon {
	    id: string;
	    name: string;
	    scientificName: string;
	    taxonAuthor?: string;
	    vernacularName_en?: string;
	    vernacularName_ja?: string;
	    description_en?: string;
	    description_ja?: string;
	    images?: string[];
	    references?: string;
	    traits: Record<string, number>;
	    continuousTraits: Record<string, ContinuousValue>;
	    categoricalTraits: Record<string, Array<string>>;
	    order?: string;
	    superfamily?: string;
	    family?: string;
	    subfamily?: string;
	    tribe?: string;
	    subtribe?: string;
	    genus?: string;
	    subgenus?: string;
	    species?: string;
	    subspecies?: string;
	
	    static createFrom(source: any = {}) {
	        return new Taxon(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.scientificName = source["scientificName"];
	        this.taxonAuthor = source["taxonAuthor"];
	        this.vernacularName_en = source["vernacularName_en"];
	        this.vernacularName_ja = source["vernacularName_ja"];
	        this.description_en = source["description_en"];
	        this.description_ja = source["description_ja"];
	        this.images = source["images"];
	        this.references = source["references"];
	        this.traits = source["traits"];
	        this.continuousTraits = this.convertValues(source["continuousTraits"], ContinuousValue, true);
	        this.categoricalTraits = source["categoricalTraits"];
	        this.order = source["order"];
	        this.superfamily = source["superfamily"];
	        this.family = source["family"];
	        this.subfamily = source["subfamily"];
	        this.tribe = source["tribe"];
	        this.subtribe = source["subtribe"];
	        this.genus = source["genus"];
	        this.subgenus = source["subgenus"];
	        this.species = source["species"];
	        this.subspecies = source["subspecies"];
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
	    traitId?: string;
	    name_en: string;
	    name_jp: string;
	    group_en: string;
	    group_jp: string;
	    type: string;
	    parent?: string;
	    parentName?: string;
	    parentDependency?: Dependency;
	    state?: string;
	    difficulty?: number;
	    risk?: number;
	    helpText_en?: string;
	    helpText_jp?: string;
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
	        this.traitId = source["traitId"];
	        this.name_en = source["name_en"];
	        this.name_jp = source["name_jp"];
	        this.group_en = source["group_en"];
	        this.group_jp = source["group_jp"];
	        this.type = source["type"];
	        this.parent = source["parent"];
	        this.parentName = source["parentName"];
	        this.parentDependency = this.convertValues(source["parentDependency"], Dependency);
	        this.state = source["state"];
	        this.difficulty = source["difficulty"];
	        this.risk = source["risk"];
	        this.helpText_en = source["helpText_en"];
	        this.helpText_jp = source["helpText_jp"];
	        this.helpImages = source["helpImages"];
	        this.minValue = source["minValue"];
	        this.maxValue = source["maxValue"];
	        this.isInteger = source["isInteger"];
	        this.states = source["states"];
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
	export class MatrixInfo {
	    title_en: string;
	    title_jp: string;
	    version: string;
	    description_en: string;
	    description_jp: string;
	    authors_en: string;
	    authors_jp: string;
	    contact_en: string;
	    contact_jp: string;
	    citation_en: string;
	    citation_jp: string;
	    references_en: string;
	    references_jp: string;
	
	    static createFrom(source: any = {}) {
	        return new MatrixInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title_en = source["title_en"];
	        this.title_jp = source["title_jp"];
	        this.version = source["version"];
	        this.description_en = source["description_en"];
	        this.description_jp = source["description_jp"];
	        this.authors_en = source["authors_en"];
	        this.authors_jp = source["authors_jp"];
	        this.contact_en = source["contact_en"];
	        this.contact_jp = source["contact_jp"];
	        this.citation_en = source["citation_en"];
	        this.citation_jp = source["citation_jp"];
	        this.references_en = source["references_en"];
	        this.references_jp = source["references_jp"];
	    }
	}
	export class Matrix {
	    name: string;
	    info: MatrixInfo;
	    traits: Trait[];
	    taxa: Taxon[];
	
	    static createFrom(source: any = {}) {
	        return new Matrix(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.info = this.convertValues(source["info"], MatrixInfo);
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
	export class HistoryItem {
	    traitName: string;
	    selection: string;
	    timestamp: number;
	
	    static createFrom(source: any = {}) {
	        return new HistoryItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.traitName = source["traitName"];
	        this.selection = source["selection"];
	        this.timestamp = source["timestamp"];
	    }
	}
	export class JustificationItem {
	    traitName: string;
	    traitGroupName: string;
	    userChoice: string;
	    taxonState: string;
	    status: string;
	
	    static createFrom(source: any = {}) {
	        return new JustificationItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.traitName = source["traitName"];
	        this.traitGroupName = source["traitGroupName"];
	        this.userChoice = source["userChoice"];
	        this.taxonState = source["taxonState"];
	        this.status = source["status"];
	    }
	}
	export class Justification {
	    matches: JustificationItem[];
	    conflicts: JustificationItem[];
	    unobserved: JustificationItem[];
	    matchCount: number;
	    conflictCount: number;
	
	    static createFrom(source: any = {}) {
	        return new Justification(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.matches = this.convertValues(source["matches"], JustificationItem);
	        this.conflicts = this.convertValues(source["conflicts"], JustificationItem);
	        this.unobserved = this.convertValues(source["unobserved"], JustificationItem);
	        this.matchCount = source["matchCount"];
	        this.conflictCount = source["conflictCount"];
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
	export class ReportRequest {
	    lang: string;
	    matrixName: string;
	    algorithm: string;
	    options: ApplyOptions;
	    history: HistoryItem[];
	    finalScores: engine.TaxonScore[];
	    matrixInfo: engine.MatrixInfo;
	
	    static createFrom(source: any = {}) {
	        return new ReportRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.lang = source["lang"];
	        this.matrixName = source["matrixName"];
	        this.algorithm = source["algorithm"];
	        this.options = this.convertValues(source["options"], ApplyOptions);
	        this.history = this.convertValues(source["history"], HistoryItem);
	        this.finalScores = this.convertValues(source["finalScores"], engine.TaxonScore);
	        this.matrixInfo = this.convertValues(source["matrixInfo"], engine.MatrixInfo);
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

