import{r as a,j as s}from"./index-DFvnA3TD.js";function m({title:e,bodyClass:t=""}){a.useEffect(()=>{const r=document.body.className;return document.body.className=t,e&&(document.title=e),window.scrollTo(0,0),()=>{document.body.className=r}},[e,t])}const i={primary:"bg-primary-container text-white hover:bg-[#C41E1A]",secondary:"bg-white text-[#1F2937] border border-[#CBD5E1] hover:bg-[#F1F5F9] hover:border-primary",ghost:"text-primary hover:bg-[#FEF2F2]",dark:"bg-[#0F172A] text-white hover:bg-[#1E293B]"},b=a.forwardRef(function({children:t,variant:r="primary",icon:o,className:n="",type:c="button",...d},l){return s.jsxs("button",{ref:l,className:`
    inline-flex shrink-0 items-center justify-center gap-1.5 h-9 px-3 rounded-full whitespace-nowrap text-body-md font-body-md-medium transition-all active:scale-[0.98]
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
    disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100
    ${i[r]??i.primary}
    ${n}
      `,type:c,...d,children:[o&&s.jsx("span",{className:"material-symbols-outlined text-base",children:o}),t]})});export{b as B,m as u};
