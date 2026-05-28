var _e=Object.defineProperty;var Ae=Object.getOwnPropertyDescriptor;var S=(o,e,t,r)=>{for(var s=r>1?void 0:r?Ae(e,t):e,n=o.length-1,i;n>=0;n--)(i=o[n])&&(s=(r?i(e,t,s):i(s))||s);return r&&s&&_e(e,t,s),s};var D=globalThis,L=D.ShadowRoot&&(D.ShadyCSS===void 0||D.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,W=Symbol(),se=new WeakMap,P=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==W)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(L&&e===void 0){let r=t!==void 0&&t.length===1;r&&(e=se.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),r&&se.set(t,e))}return e}toString(){return this.cssText}},oe=o=>new P(typeof o=="string"?o:o+"",void 0,W),K=(o,...e)=>{let t=o.length===1?o[0]:e.reduce((r,s,n)=>r+(i=>{if(i._$cssResult$===!0)return i.cssText;if(typeof i=="number")return i;throw Error("Value passed to 'css' function must be a 'css' function result: "+i+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+o[n+1],o[0]);return new P(t,o,W)},ie=(o,e)=>{if(L)o.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let r=document.createElement("style"),s=D.litNonce;s!==void 0&&r.setAttribute("nonce",s),r.textContent=t.cssText,o.appendChild(r)}},G=L?o=>o:o=>o instanceof CSSStyleSheet?(e=>{let t="";for(let r of e.cssRules)t+=r.cssText;return oe(t)})(o):o;var{is:we,defineProperty:Se,getOwnPropertyDescriptor:Ee,getOwnPropertyNames:ke,getOwnPropertySymbols:Ce,getPrototypeOf:Pe}=Object,$=globalThis,ne=$.trustedTypes,Te=ne?ne.emptyScript:"",Oe=$.reactiveElementPolyfillSupport,T=(o,e)=>o,O={toAttribute(o,e){switch(e){case Boolean:o=o?Te:null;break;case Object:case Array:o=o==null?o:JSON.stringify(o)}return o},fromAttribute(o,e){let t=o;switch(e){case Boolean:t=o!==null;break;case Number:t=o===null?null:Number(o);break;case Object:case Array:try{t=JSON.parse(o)}catch{t=null}}return t}},I=(o,e)=>!we(o,e),ae={attribute:!0,type:String,converter:O,reflect:!1,useDefault:!1,hasChanged:I};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),$.litPropertyMetadata??($.litPropertyMetadata=new WeakMap);var m=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=ae){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let r=Symbol(),s=this.getPropertyDescriptor(e,r,t);s!==void 0&&Se(this.prototype,e,s)}}static getPropertyDescriptor(e,t,r){let{get:s,set:n}=Ee(this.prototype,e)??{get(){return this[t]},set(i){this[t]=i}};return{get:s,set(i){let c=s?.call(this);n?.call(this,i),this.requestUpdate(e,c,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??ae}static _$Ei(){if(this.hasOwnProperty(T("elementProperties")))return;let e=Pe(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(T("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(T("properties"))){let t=this.properties,r=[...ke(t),...Ce(t)];for(let s of r)this.createProperty(s,t[s])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[r,s]of t)this.elementProperties.set(r,s)}this._$Eh=new Map;for(let[t,r]of this.elementProperties){let s=this._$Eu(t,r);s!==void 0&&this._$Eh.set(s,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let r=new Set(e.flat(1/0).reverse());for(let s of r)t.unshift(G(s))}else e!==void 0&&t.push(G(e));return t}static _$Eu(e,t){let r=t.attribute;return r===!1?void 0:typeof r=="string"?r:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let r of t.keys())this.hasOwnProperty(r)&&(e.set(r,this[r]),delete this[r]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return ie(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,r){this._$AK(e,r)}_$ET(e,t){let r=this.constructor.elementProperties.get(e),s=this.constructor._$Eu(e,r);if(s!==void 0&&r.reflect===!0){let n=(r.converter?.toAttribute!==void 0?r.converter:O).toAttribute(t,r.type);this._$Em=e,n==null?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(e,t){let r=this.constructor,s=r._$Eh.get(e);if(s!==void 0&&this._$Em!==s){let n=r.getPropertyOptions(s),i=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:O;this._$Em=s;let c=i.fromAttribute(t,n.type);this[s]=c??this._$Ej?.get(s)??c,this._$Em=null}}requestUpdate(e,t,r,s=!1,n){if(e!==void 0){let i=this.constructor;if(s===!1&&(n=this[e]),r??(r=i.getPropertyOptions(e)),!((r.hasChanged??I)(n,t)||r.useDefault&&r.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(i._$Eu(e,r))))return;this.C(e,t,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:r,reflect:s,wrapped:n},i){r&&!(this._$Ej??(this._$Ej=new Map)).has(e)&&(this._$Ej.set(e,i??t??this[e]),n!==!0||i!==void 0)||(this._$AL.has(e)||(this.hasUpdated||r||(t=void 0),this._$AL.set(e,t)),s===!0&&this._$Em!==e&&(this._$Eq??(this._$Eq=new Set)).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(let[s,n]of this._$Ep)this[s]=n;this._$Ep=void 0}let r=this.constructor.elementProperties;if(r.size>0)for(let[s,n]of r){let{wrapped:i}=n,c=this[s];i!==!0||this._$AL.has(s)||c===void 0||this.C(s,void 0,n,c)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(r=>r.hostUpdate?.()),this.update(t)):this._$EM()}catch(r){throw e=!1,this._$EM(),r}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&(this._$Eq=this._$Eq.forEach(t=>this._$ET(t,this[t]))),this._$EM()}updated(e){}firstUpdated(e){}};m.elementStyles=[],m.shadowRootOptions={mode:"open"},m[T("elementProperties")]=new Map,m[T("finalized")]=new Map,Oe?.({ReactiveElement:m}),($.reactiveElementVersions??($.reactiveElementVersions=[])).push("2.1.2");var U=globalThis,ce=o=>o,F=U.trustedTypes,le=F?F.createPolicy("lit-html",{createHTML:o=>o}):void 0,me="$lit$",b=`lit$${Math.random().toFixed(9).slice(2)}$`,ge="?"+b,Me=`<${ge}>`,A=document,H=()=>A.createComment(""),B=o=>o===null||typeof o!="object"&&typeof o!="function",te=Array.isArray,Ue=o=>te(o)||typeof o?.[Symbol.iterator]=="function",J=`[ 	
\f\r]`,M=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,he=/-->/g,de=/>/g,y=RegExp(`>|${J}(?:([^\\s"'>=/]+)(${J}*=${J}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),pe=/'/g,ue=/"/g,ve=/^(?:script|style|textarea|title)$/i,re=o=>(e,...t)=>({_$litType$:o,strings:e,values:t}),u=re(1),Fe=re(2),Ve=re(3),w=Symbol.for("lit-noChange"),d=Symbol.for("lit-nothing"),fe=new WeakMap,_=A.createTreeWalker(A,129);function $e(o,e){if(!te(o)||!o.hasOwnProperty("raw"))throw Error("invalid template strings array");return le!==void 0?le.createHTML(e):e}var He=(o,e)=>{let t=o.length-1,r=[],s,n=e===2?"<svg>":e===3?"<math>":"",i=M;for(let c=0;c<t;c++){let a=o[c],h,p,l=-1,f=0;for(;f<a.length&&(i.lastIndex=f,p=i.exec(a),p!==null);)f=i.lastIndex,i===M?p[1]==="!--"?i=he:p[1]!==void 0?i=de:p[2]!==void 0?(ve.test(p[2])&&(s=RegExp("</"+p[2],"g")),i=y):p[3]!==void 0&&(i=y):i===y?p[0]===">"?(i=s??M,l=-1):p[1]===void 0?l=-2:(l=i.lastIndex-p[2].length,h=p[1],i=p[3]===void 0?y:p[3]==='"'?ue:pe):i===ue||i===pe?i=y:i===he||i===de?i=M:(i=y,s=void 0);let v=i===y&&o[c+1].startsWith("/>")?" ":"";n+=i===M?a+Me:l>=0?(r.push(h),a.slice(0,l)+me+a.slice(l)+b+v):a+b+(l===-2?c:v)}return[$e(o,n+(o[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),r]},N=class o{constructor({strings:e,_$litType$:t},r){let s;this.parts=[];let n=0,i=0,c=e.length-1,a=this.parts,[h,p]=He(e,t);if(this.el=o.createElement(h,r),_.currentNode=this.el.content,t===2||t===3){let l=this.el.content.firstChild;l.replaceWith(...l.childNodes)}for(;(s=_.nextNode())!==null&&a.length<c;){if(s.nodeType===1){if(s.hasAttributes())for(let l of s.getAttributeNames())if(l.endsWith(me)){let f=p[i++],v=s.getAttribute(l).split(b),j=/([.?@])?(.*)/.exec(f);a.push({type:1,index:n,name:j[2],strings:v,ctor:j[1]==="."?Y:j[1]==="?"?Z:j[1]==="@"?Q:k}),s.removeAttribute(l)}else l.startsWith(b)&&(a.push({type:6,index:n}),s.removeAttribute(l));if(ve.test(s.tagName)){let l=s.textContent.split(b),f=l.length-1;if(f>0){s.textContent=F?F.emptyScript:"";for(let v=0;v<f;v++)s.append(l[v],H()),_.nextNode(),a.push({type:2,index:++n});s.append(l[f],H())}}}else if(s.nodeType===8)if(s.data===ge)a.push({type:2,index:n});else{let l=-1;for(;(l=s.data.indexOf(b,l+1))!==-1;)a.push({type:7,index:n}),l+=b.length-1}n++}}static createElement(e,t){let r=A.createElement("template");return r.innerHTML=e,r}};function E(o,e,t=o,r){if(e===w)return e;let s=r!==void 0?t._$Co?.[r]:t._$Cl,n=B(e)?void 0:e._$litDirective$;return s?.constructor!==n&&(s?._$AO?.(!1),n===void 0?s=void 0:(s=new n(o),s._$AT(o,t,r)),r!==void 0?(t._$Co??(t._$Co=[]))[r]=s:t._$Cl=s),s!==void 0&&(e=E(o,s._$AS(o,e.values),s,r)),e}var X=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:r}=this._$AD,s=(e?.creationScope??A).importNode(t,!0);_.currentNode=s;let n=_.nextNode(),i=0,c=0,a=r[0];for(;a!==void 0;){if(i===a.index){let h;a.type===2?h=new R(n,n.nextSibling,this,e):a.type===1?h=new a.ctor(n,a.name,a.strings,this,e):a.type===6&&(h=new ee(n,this,e)),this._$AV.push(h),a=r[++c]}i!==a?.index&&(n=_.nextNode(),i++)}return _.currentNode=A,s}p(e){let t=0;for(let r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(e,r,t),t+=r.strings.length-2):r._$AI(e[t])),t++}},R=class o{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,r,s){this.type=2,this._$AH=d,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=r,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=E(this,e,t),B(e)?e===d||e==null||e===""?(this._$AH!==d&&this._$AR(),this._$AH=d):e!==this._$AH&&e!==w&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Ue(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==d&&B(this._$AH)?this._$AA.nextSibling.data=e:this.T(A.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:r}=e,s=typeof r=="number"?this._$AC(e):(r.el===void 0&&(r.el=N.createElement($e(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===s)this._$AH.p(t);else{let n=new X(s,this),i=n.u(this.options);n.p(t),this.T(i),this._$AH=n}}_$AC(e){let t=fe.get(e.strings);return t===void 0&&fe.set(e.strings,t=new N(e)),t}k(e){te(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,r,s=0;for(let n of e)s===t.length?t.push(r=new o(this.O(H()),this.O(H()),this,this.options)):r=t[s],r._$AI(n),s++;s<t.length&&(this._$AR(r&&r._$AB.nextSibling,s),t.length=s)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let r=ce(e).nextSibling;ce(e).remove(),e=r}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},k=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,r,s,n){this.type=1,this._$AH=d,this._$AN=void 0,this.element=e,this.name=t,this._$AM=s,this.options=n,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=d}_$AI(e,t=this,r,s){let n=this.strings,i=!1;if(n===void 0)e=E(this,e,t,0),i=!B(e)||e!==this._$AH&&e!==w,i&&(this._$AH=e);else{let c=e,a,h;for(e=n[0],a=0;a<n.length-1;a++)h=E(this,c[r+a],t,a),h===w&&(h=this._$AH[a]),i||(i=!B(h)||h!==this._$AH[a]),h===d?e=d:e!==d&&(e+=(h??"")+n[a+1]),this._$AH[a]=h}i&&!s&&this.j(e)}j(e){e===d?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},Y=class extends k{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===d?void 0:e}},Z=class extends k{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==d)}},Q=class extends k{constructor(e,t,r,s,n){super(e,t,r,s,n),this.type=5}_$AI(e,t=this){if((e=E(this,e,t,0)??d)===w)return;let r=this._$AH,s=e===d&&r!==d||e.capture!==r.capture||e.once!==r.once||e.passive!==r.passive,n=e!==d&&(r===d||s);s&&this.element.removeEventListener(this.name,this,r),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},ee=class{constructor(e,t,r){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(e){E(this,e)}};var Be=U.litHtmlPolyfillSupport;Be?.(N,R),(U.litHtmlVersions??(U.litHtmlVersions=[])).push("3.3.3");var be=(o,e,t)=>{let r=t?.renderBefore??e,s=r._$litPart$;if(s===void 0){let n=t?.renderBefore??null;r._$litPart$=s=new R(e.insertBefore(H(),n),n,void 0,t??{})}return s._$AI(o),s};var z=globalThis,x=class extends m{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t;let e=super.createRenderRoot();return(t=this.renderOptions).renderBefore??(t.renderBefore=e.firstChild),e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=be(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return w}};x._$litElement$=!0,x.finalized=!0,z.litElementHydrateSupport?.({LitElement:x});var Ne=z.litElementPolyfillSupport;Ne?.({LitElement:x});(z.litElementVersions??(z.litElementVersions=[])).push("4.2.2");var xe=o=>(e,t)=>{t!==void 0?t.addInitializer(()=>{customElements.define(o,e)}):customElements.define(o,e)};var Re={attribute:!0,type:String,converter:O,reflect:!1,hasChanged:I},ze=(o=Re,e,t)=>{let{kind:r,metadata:s}=t,n=globalThis.litPropertyMetadata.get(s);if(n===void 0&&globalThis.litPropertyMetadata.set(s,n=new Map),r==="setter"&&((o=Object.create(o)).wrapped=!0),n.set(t.name,o),r==="accessor"){let{name:i}=t;return{set(c){let a=e.get.call(this);e.set.call(this,c),this.requestUpdate(i,a,o,!0,c)},init(c){return c!==void 0&&this.C(i,void 0,o,c),c}}}if(r==="setter"){let{name:i}=t;return function(c){let a=this[i];e.call(this,c),this.requestUpdate(i,a,o,!0,c)}}throw Error("Unsupported decorator location: "+r)};function C(o){return(e,t)=>typeof t=="object"?ze(o,e,t):((r,s,n)=>{let i=s.hasOwnProperty(n);return s.constructor.createProperty(n,r),i?Object.getOwnPropertyDescriptor(s,n):void 0})(o,e,t)}function ye(o){return C({...o,state:!0,attribute:!1})}var q={dark:{name:"dark",label:"Dark",colors:{background:"#0d1117",surface:"#161b22",surfaceBorder:"#30363d",text:"#c9d1d9",textSecondary:"#8b949e",textMuted:"#484f58",primary:"#58a6ff",primaryHover:"#79b8ff",accent:"#3fb950",error:"#f85149",errorBg:"#f8514914",inputBg:"#0d1117",inputBorder:"#30363d",inputFocus:"#58a6ff",tagBg:"#21262d",tagText:"#484f58",link:"#58a6ff",divider:"#21262d",placeholder:"#484f58",shadow:"#01040940"}},light:{name:"light",label:"Light",colors:{background:"#ffffff",surface:"#f6f8fa",surfaceBorder:"#d0d7de",text:"#1f2328",textSecondary:"#656d76",textMuted:"#8c959f",primary:"#0969da",primaryHover:"#0550ae",accent:"#1a7f37",error:"#cf222e",errorBg:"#ffccd5",inputBg:"#ffffff",inputBorder:"#d0d7de",inputFocus:"#0969da",tagBg:"#eff1f3",tagText:"#656d76",link:"#0969da",divider:"#d0d7de",placeholder:"#8c959f",shadow:"#0104091a"}},slate:{name:"slate",label:"Slate",colors:{background:"#0f172a",surface:"#1e293b",surfaceBorder:"#334155",text:"#e2e8f0",textSecondary:"#94a3b8",textMuted:"#475569",primary:"#818cf8",primaryHover:"#a5b4fc",accent:"#34d399",error:"#f87171",errorBg:"#f8717120",inputBg:"#0f172a",inputBorder:"#334155",inputFocus:"#818cf8",tagBg:"#1e293b",tagText:"#64748b",link:"#818cf8",divider:"#1e293b",placeholder:"#475569",shadow:"#00000050"}},ocean:{name:"ocean",label:"Ocean",colors:{background:"#0a192f",surface:"#112240",surfaceBorder:"#233554",text:"#ccd6f6",textSecondary:"#8892b0",textMuted:"#495670",primary:"#64ffda",primaryHover:"#80ffeb",accent:"#64ffda",error:"#ff6b6b",errorBg:"#ff6b6b20",inputBg:"#0a192f",inputBorder:"#233554",inputFocus:"#64ffda",tagBg:"#112240",tagText:"#495670",link:"#64ffda",divider:"#112240",placeholder:"#495670",shadow:"#00000060"}}},g=class extends x{constructor(){super(...arguments);this.data={query:"",results:[]};this.theme="dark";this.themeMode="dark";this.showThemePicker=!1}get currentTheme(){return q[this.theme]||q.dark}get colors(){return this.currentTheme.colors}get resolvedTheme(){return this.themeMode==="system"?window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light":this.themeMode}get resolvedColors(){return q[this.resolvedTheme].colors}render(){let{query:t,results:r,aiOverview:s,aiOverviewError:n}=this.data;return u`
      <header class="header">
        <div class="header-inner">
          <span class="logo" @click=${()=>this.reset()}>Aetherium Search</span>
          <form class="search-form" @submit=${this.onSubmit} @reset=${this.reset}>
            <input
              type="search"
              class="search-input"
              name="q"
              placeholder="Search the web..."
              value="${t}"
              autofocus
            />
            <button type="submit" class="search-btn">\u2192</button>
          </form>
          <div style="position: relative;">
            <button class="theme-toggle" @click=${()=>this.showThemePicker=!this.showThemePicker}>
              ${this.theme}
            </button>
            ${this.showThemePicker?u`
                  <div class="theme-picker">
                    ${Object.values(q).map(i=>u`
                        <div
                          class="theme-option ${this.theme===i.name?"active":""}"
                          data-theme="${i.name}"
                          @click=${()=>this.setTheme(i.name)}
                          title="${i.label}"
                        ></div>
                      `)}
                  </div>
                `:""}
          </div>
        </div>
      </header>

      <main class="content">
        ${s?u`
            <section class="ai-overview">
              <div class="ai-overview-label">AI Overview</div>
              <p>${s}</p>
            </section>
          `:""}

        ${n?u`
            <section class="ai-overview error">
              <div class="ai-overview-label">AI Overview unavailable</div>
              <p>${n}</p>
            </section>
          `:""}

        <div class="results-count">
          ${r.length} result${r.length!==1?"s":""} for "${t}"
        </div>

        ${r.length===0&&!n?u`
            <div class="empty-state">
              <h2>No results found</h2>
              <p>Try different keywords or check your spelling.</p>
            </div>
          `:""}

        ${r.map(i=>u`
            <article class="result">
              <div class="result-url">
                ${i.parsed_url?i.parsed_url.join(" > "):i.url}
              </div>
              <h3 class="result-title">
                <a href="${i.url}" target="_blank" rel="noopener noreferrer">${i.title}</a>
              </h3>
              ${i.content?u`<p class="result-snippet">${i.content}</p>`:""}
              ${i.engine?u`<span class="result-engine">${i.engine}</span>`:""}
            </article>
          `)}
      </main>
    `}onSubmit(t){t.preventDefault();let s=t.target.querySelector('[name="q"]').value.trim();s&&(window.location.href=`/search?q=${encodeURIComponent(s)}`)}reset(){window.location.href="/"}setTheme(t){this.theme=t,this.showThemePicker=!1,document.cookie=`aetherium-theme=${t}; path=/; max-age=31536000`}connectedCallback(){super.connectedCallback();let t=document.cookie.split("; ").find(r=>r.startsWith("aetherium-theme="));if(t){let r=t.split("=")[1];q[r]&&(this.theme=r)}}};g.styles=K`
    :host {
      --bg: var(--colors-background);
      --surface: var(--colors-surface);
      --surface-border: var(--colors-surface-border);
      --text: var(--colors-text);
      --text-secondary: var(--colors-text-secondary);
      --text-muted: var(--colors-text-muted);
      --primary: var(--colors-primary);
      --primary-hover: var(--colors-primary-hover);
      --accent: var(--colors-accent);
      --error: var(--colors-error);
      --error-bg: var(--colors-error-bg);
      --input-bg: var(--colors-input-bg);
      --input-border: var(--colors-input-border);
      --input-focus: var(--colors-input-focus);
      --tag-bg: var(--colors-tag-bg);
      --tag-text: var(--colors-tag-text);
      --link: var(--colors-link);
      --divider: var(--colors-divider);
      --placeholder: var(--colors-placeholder);
      --shadow: var(--colors-shadow);

      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
      display: block;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .header {
      background: var(--surface);
      border-bottom: 1px solid var(--surface-border);
      padding: 16px 24px;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-inner {
      max-width: 960px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary);
      text-decoration: none;
      white-space: nowrap;
      cursor: pointer;
    }

    .search-form {
      flex: 1;
      max-width: 640px;
      position: relative;
    }

    .search-input {
      width: 100%;
      padding: 10px 40px 10px 16px;
      border: 1px solid var(--input-border);
      border-radius: 8px;
      background: var(--input-bg);
      color: var(--text);
      font-size: 15px;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      border-color: var(--input-focus);
      box-shadow: 0 0 0 3px var(--input-focus)22;
    }

    .search-input::placeholder {
      color: var(--placeholder);
    }

    .theme-toggle {
      background: none;
      border: 1px solid var(--surface-border);
      color: var(--text-secondary);
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
    }

    .theme-toggle:hover {
      color: var(--text);
      border-color: var(--text-secondary);
    }

    .theme-picker {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      padding: 8px;
      display: flex;
      gap: 4px;
      box-shadow: 0 8px 24px var(--shadow);
      z-index: 200;
    }

    .theme-option {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .theme-option:hover {
      transform: scale(1.15);
    }

    .theme-option.active {
      border-color: var(--primary);
    }

    .theme-option[data-theme="dark"] { background: #0d1117; border: 1px solid #30363d; }
    .theme-option[data-theme="light"] { background: #ffffff; border: 1px solid #d0d7de; }
    .theme-option[data-theme="slate"] { background: #0f172a; border: 1px solid #334155; }
    .theme-option[data-theme="ocean"] { background: #0a192f; border: 1px solid #233554; }

    .content {
      max-width: 960px;
      margin: 0 auto;
      padding: 24px;
    }

    .ai-overview {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
    }

    .ai-overview-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--primary);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .ai-overview-label::before {
      content: "\2726";
      font-size: 14px;
    }

    .ai-overview.error {
      border-color: var(--error);
      background: var(--error-bg);
    }

    .ai-overview.error .ai-overview-label {
      color: var(--error);
    }

    .ai-overview.error .ai-overview-label::before {
      content: "\26A0";
    }

    .ai-overview p {
      font-size: 15px;
      line-height: 1.7;
      white-space: pre-wrap;
    }

    .results-count {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 20px;
    }

    .result {
      padding: 20px 0;
      border-bottom: 1px solid var(--divider);
    }

    .result:last-child {
      border-bottom: none;
    }

    .result-url {
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .result-title {
      font-size: 18px;
      margin-bottom: 6px;
    }

    .result-title a {
      color: var(--link);
      text-decoration: none;
    }

    .result-title a:hover {
      text-decoration: underline;
    }

    .result-snippet {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .result-engine {
      font-size: 11px;
      color: var(--tag-text);
      background: var(--tag-bg);
      padding: 2px 8px;
      border-radius: 12px;
      display: inline-block;
      margin-top: 8px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 24px;
      color: var(--text-muted);
    }

    .empty-state h2 {
      font-size: 20px;
      margin-bottom: 8px;
      color: var(--text-secondary);
    }

    .search-btn {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: var(--primary);
      border: none;
      color: var(--bg);
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }

    @media (max-width: 640px) {
      .header-inner { flex-wrap: wrap; }
      .search-form { order: 2; max-width: 100%; }
      .content { padding: 16px; }
    }
  `,S([C({type:Object})],g.prototype,"data",2),S([C({type:String})],g.prototype,"theme",2),S([C({type:String})],g.prototype,"themeMode",2),S([ye()],g.prototype,"showThemePicker",2),g=S([xe("search-results")],g);export{g as SearchResults,q as themes};
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/lit-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-element/lit-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/custom-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/property.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/state.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/event-options.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/base.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-all.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-async.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-assigned-elements.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-assigned-nodes.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
