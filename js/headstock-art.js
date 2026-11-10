const HEADSTOCK_ART = `
<defs>
  <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#B98A50"></stop>
    <stop offset="0.15" stop-color="#D9B077"></stop>
    <stop offset="0.4" stop-color="#EBCB93"></stop>
    <stop offset="0.52" stop-color="#F2D8A5"></stop>
    <stop offset="0.65" stop-color="#E6C287"></stop>
    <stop offset="0.88" stop-color="#CFA066"></stop>
    <stop offset="1" stop-color="#A97A43"></stop>
  </linearGradient>
  <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.18"></stop>
    <stop offset="0.35" stop-color="#FFFFFF" stop-opacity="0.04"></stop>
    <stop offset="1" stop-color="#5A3A14" stop-opacity="0.22"></stop>
  </linearGradient>
  <linearGradient id="chromeH" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#F4F6F8"></stop>
    <stop offset="0.35" stop-color="#C3C8CE"></stop>
    <stop offset="0.55" stop-color="#7D838B"></stop>
    <stop offset="0.8" stop-color="#B9BEC5"></stop>
    <stop offset="1" stop-color="#5E636B"></stop>
  </linearGradient>
  <linearGradient id="chromeV" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#7E848C"></stop>
    <stop offset="0.3" stop-color="#D5D9DE"></stop>
    <stop offset="0.55" stop-color="#9CA2AA"></stop>
    <stop offset="1" stop-color="#6A7078"></stop>
  </linearGradient>
  <radialGradient id="bushing" cx="0.38" cy="0.35" r="0.7">
    <stop offset="0" stop-color="#FFFFFF"></stop>
    <stop offset="0.35" stop-color="#C9CED4"></stop>
    <stop offset="0.8" stop-color="#6F757D"></stop>
    <stop offset="1" stop-color="#3E4248"></stop>
  </radialGradient>
  <radialGradient id="post" cx="0.4" cy="0.4" r="0.6">
    <stop offset="0" stop-color="#E9ECEF"></stop>
    <stop offset="1" stop-color="#80868E"></stop>
  </radialGradient>
  <linearGradient id="nut" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FBF7EC"></stop>
    <stop offset="1" stop-color="#D3C7AC"></stop>
  </linearGradient>
  <linearGradient id="board" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#1F120B"></stop>
    <stop offset="0.5" stop-color="#3A2417"></stop>
    <stop offset="1" stop-color="#1F120B"></stop>
  </linearGradient>
  <clipPath id="hsClip">
    <path d="M152 432 C150 418 134 410 128 396 C122 330 112 220 104 130 C100 80 103 42 114 32 Q126 24 195 24 Q264 24 276 32 C287 42 290 80 286 130 C278 220 268 330 262 396 C256 410 240 418 238 432 Z"></path>
  </clipPath>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.018 0.42" numOctaves="3" seed="7"></feTurbulence>
    <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.27  0 0 0 0 0.10  1.4 0 0 0 -0.62"></feColorMatrix>
  </filter>
  <filter id="figure" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.006 0.05" numOctaves="2" seed="3"></feTurbulence>
    <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.95  0 0 0 0 0.85  0.9 0 0 0 -0.45"></feColorMatrix>
  </filter>
  <filter id="boardGrain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.03 0.5" numOctaves="3" seed="11"></feTurbulence>
    <feColorMatrix type="matrix" values="0 0 0 0 0.32  0 0 0 0 0.19  0 0 0 0 0.11  1.2 0 0 0 -0.5"></feColorMatrix>
  </filter>
  <linearGradient id="bronze" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#6E6E6E"></stop>
    <stop offset="0.45" stop-color="#E4E4E2"></stop>
    <stop offset="1" stop-color="#7E7E7C"></stop>
  </linearGradient>
  <filter id="dof" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.1"></feGaussianBlur></filter>
  <filter id="drop" x="-30%" y="-10%" width="160%" height="130%">
    <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000000" flood-opacity="0.28"></feDropShadow>
  </filter>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
    <feDropShadow dx="1" dy="2" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.55"></feDropShadow>
  </filter>
  <filter id="glow" x="-200%" y="-20%" width="500%" height="140%">
    <feGaussianBlur stdDeviation="2.5" result="b"></feGaussianBlur>
    <feMerge><feMergeNode in="b"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
  </filter>
  <linearGradient id="btn" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#E6E9EC"></stop>
    <stop offset="0.4" stop-color="#BCC1C7"></stop>
    <stop offset="0.65" stop-color="#9DA3AA"></stop>
    <stop offset="1" stop-color="#C6CACF"></stop>
  </linearGradient>
</defs>

<g clip-path="url(#hsClip)" fill="none" stroke="#A8783F" stroke-linecap="round">
  <path d="M150 440 C150 300 140 200 146 20" stroke-width="1.2" opacity="0.45"></path>
  <path d="M162 440 C158 320 156 210 162 20" stroke-width="0.8" opacity="0.35"></path>
  <path d="M172 440 C170 330 166 180 176 20" stroke-width="1.4" opacity="0.3"></path>
  <path d="M184 440 C182 300 186 160 182 20" stroke-width="0.7" opacity="0.4"></path>
  <path d="M196 440 C198 320 192 200 198 20" stroke-width="1.1" opacity="0.28"></path>
  <path d="M207 440 C206 330 212 190 206 20" stroke-width="0.8" opacity="0.38"></path>
  <path d="M218 440 C222 320 216 200 222 20" stroke-width="1.3" opacity="0.3"></path>
  <path d="M229 440 C232 300 230 180 236 20" stroke-width="0.9" opacity="0.4"></path>
  <path d="M242 440 C246 320 244 200 250 20" stroke-width="1.2" opacity="0.42"></path>
  <path d="M176 210 C182 190 188 190 192 210 C194 226 186 234 180 226" stroke-width="0.8" opacity="0.3"></path>
  <path d="M206 120 C212 104 220 106 222 122" stroke-width="0.7" opacity="0.3"></path>
  <rect x="90" y="0" width="210" height="440" filter="url(#grain)" stroke="none" opacity="0.7"></rect>
  <rect x="90" y="0" width="210" height="440" filter="url(#figure)" stroke="none" opacity="0.35"></rect>
  <rect x="90" y="0" width="210" height="440" fill="url(#sheen)" stroke="none"></rect>
</g>
<g transform="rotate(-6 70 110)" filter="url(#soft)">
  <rect x="50" y="95" width="40" height="30" rx="8" fill="url(#btn)" stroke="#7A8088" stroke-width="1"></rect>
  <rect x="53" y="97" width="34" height="6" rx="3" fill="#FFFFFF" opacity="0.35"></rect>
</g>
<g transform="rotate(-4 70 230)" filter="url(#soft)">
  <rect x="50" y="215" width="40" height="30" rx="8" fill="url(#btn)" stroke="#7A8088" stroke-width="1"></rect>
  <rect x="53" y="217" width="34" height="6" rx="3" fill="#FFFFFF" opacity="0.35"></rect>
</g>
<g transform="rotate(-2 70 350)" filter="url(#soft)">
  <rect x="50" y="335" width="40" height="30" rx="8" fill="url(#btn)" stroke="#7A8088" stroke-width="1"></rect>
  <rect x="53" y="337" width="34" height="6" rx="3" fill="#FFFFFF" opacity="0.35"></rect>
</g>
<g transform="rotate(6 320 110)" filter="url(#soft)">
  <rect x="300" y="95" width="40" height="30" rx="8" fill="url(#btn)" stroke="#7A8088" stroke-width="1"></rect>
  <rect x="303" y="97" width="34" height="6" rx="3" fill="#FFFFFF" opacity="0.35"></rect>
</g>
<g transform="rotate(4 320 230)" filter="url(#soft)">
  <rect x="300" y="215" width="40" height="30" rx="8" fill="url(#btn)" stroke="#7A8088" stroke-width="1"></rect>
  <rect x="303" y="217" width="34" height="6" rx="3" fill="#FFFFFF" opacity="0.35"></rect>
</g>
<g transform="rotate(2 320 350)" filter="url(#soft)">
  <rect x="300" y="335" width="40" height="30" rx="8" fill="url(#btn)" stroke="#7A8088" stroke-width="1"></rect>
  <rect x="303" y="337" width="34" height="6" rx="3" fill="#FFFFFF" opacity="0.35"></rect>
</g>
<g filter="url(#soft)">
  <rect x="88" y="107" width="30" height="6" rx="3" fill="url(#chromeH)"></rect>
  <rect x="88" y="227" width="30" height="6" rx="3" fill="url(#chromeH)"></rect>
  <rect x="88" y="347" width="30" height="6" rx="3" fill="url(#chromeH)"></rect>
  <rect x="272" y="107" width="30" height="6" rx="3" fill="url(#chromeH)"></rect>
  <rect x="272" y="227" width="30" height="6" rx="3" fill="url(#chromeH)"></rect>
  <rect x="272" y="347" width="30" height="6" rx="3" fill="url(#chromeH)"></rect>
  <rect x="112" y="99" width="30" height="22" rx="5" fill="url(#chromeH)"></rect>
  <rect x="112" y="219" width="30" height="22" rx="5" fill="url(#chromeH)"></rect>
  <rect x="114" y="339" width="30" height="22" rx="5" fill="url(#chromeH)"></rect>
  <rect x="248" y="99" width="30" height="22" rx="5" fill="url(#chromeH)"></rect>
  <rect x="248" y="219" width="30" height="22" rx="5" fill="url(#chromeH)"></rect>
  <rect x="246" y="339" width="30" height="22" rx="5" fill="url(#chromeH)"></rect>
</g>

<rect x="152" y="420" width="86" height="150" fill="url(#board)"></rect>
<rect x="152" y="420" width="86" height="150" filter="url(#boardGrain)" opacity="0.8"></rect>
<rect x="152" y="420" width="3" height="150" fill="#000000" opacity="0.35"></rect>
<rect x="235" y="420" width="3" height="150" fill="#000000" opacity="0.35"></rect>
<line x1="152" y1="466" x2="238" y2="466" stroke="#D9DCE0" stroke-width="3"></line>
<line x1="152" y1="465" x2="238" y2="465" stroke="#FFFFFF" stroke-width="1" opacity="0.7"></line>
<line x1="152" y1="436" x2="238" y2="436" stroke="#C9CDD2" stroke-width="2.5"></line>
<line x1="152" y1="512" x2="238" y2="512" stroke="#D9DCE0" stroke-width="3"></line>
<line x1="152" y1="511" x2="238" y2="511" stroke="#FFFFFF" stroke-width="1" opacity="0.7"></line>
<circle cx="195" cy="545" r="4.5" fill="#E9E4D8" opacity="0.9"></circle>

<g filter="url(#drop)">
  <path d="M152 432 C150 418 134 410 128 396 C122 330 112 220 104 130 C100 80 103 42 114 32 Q126 24 195 24 Q264 24 276 32 C287 42 290 80 286 130 C278 220 268 330 262 396 C256 410 240 418 238 432 Z" fill="url(#wood)"></path>
</g>
<path d="M152 432 C150 418 134 410 128 396 C122 330 112 220 104 130 C100 80 103 42 114 32 Q126 24 195 24 Q264 24 276 32 C287 42 290 80 286 130 C278 220 268 330 262 396 C256 410 240 418 238 432" fill="none" stroke="#9C6E38" stroke-width="1.2" opacity="0.8"></path>
<rect x="150" y="413" width="90" height="10" rx="2" fill="url(#nut)" filter="url(#soft)"></rect>

<polyline points="164,352 170,418 170,570" fill="none" stroke="#1A1A1A" stroke-opacity="0.22" stroke-width="1.8"></polyline>
<polyline points="162,350 168,418 168,570" fill="none" stroke="#B9BEC4" stroke-width="1.8"></polyline>
<polyline points="161.7,350 167.7,418 167.7,570" fill="none" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="0.6"></polyline>
<polyline points="164,232 179,418 179,570" fill="none" stroke="#1A1A1A" stroke-opacity="0.22" stroke-width="1.8"></polyline>
<polyline points="162,230 177,418 177,570" fill="none" stroke="#B9BEC4" stroke-width="1.8"></polyline>
<polyline points="161.7,230 176.7,418 176.7,570" fill="none" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="0.6"></polyline>
<polyline points="164,112 188,418 188,570" fill="none" stroke="#1A1A1A" stroke-opacity="0.22" stroke-width="1.8"></polyline>
<polyline points="162,110 186,418 186,570" fill="none" stroke="#B9BEC4" stroke-width="1.8"></polyline>
<polyline points="161.7,110 185.7,418 185.7,570" fill="none" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="0.6"></polyline>
<polyline points="230,112 206,418 206,570" fill="none" stroke="#1A1A1A" stroke-opacity="0.22" stroke-width="1.8"></polyline>
<polyline points="228,110 204,418 204,570" fill="none" stroke="#B9BEC4" stroke-width="1.8"></polyline>
<polyline points="227.7,110 203.7,418 203.7,570" fill="none" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="0.6"></polyline>
<polyline points="230,232 215,418 215,570" fill="none" stroke="#1A1A1A" stroke-opacity="0.22" stroke-width="1.8"></polyline>
<polyline points="228,230 213,418 213,570" fill="none" stroke="#B9BEC4" stroke-width="1.8"></polyline>
<polyline points="227.7,230 212.7,418 212.7,570" fill="none" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="0.6"></polyline>
<polyline points="230,352 224,418 224,570" fill="none" stroke="#1A1A1A" stroke-opacity="0.22" stroke-width="1.8"></polyline>
<polyline points="228,350 222,418 222,570" fill="none" stroke="#B9BEC4" stroke-width="1.8"></polyline>
<polyline points="227.7,350 221.7,418 221.7,570" fill="none" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="0.6"></polyline>

<g filter="url(#soft)">
  <circle cx="156" cy="110" r="11" fill="url(#bushing)"></circle>
  <circle cx="156" cy="230" r="11" fill="url(#bushing)"></circle>
  <circle cx="156" cy="350" r="11" fill="url(#bushing)"></circle>
  <circle cx="234" cy="110" r="11" fill="url(#bushing)"></circle>
  <circle cx="234" cy="230" r="11" fill="url(#bushing)"></circle>
  <circle cx="234" cy="350" r="11" fill="url(#bushing)"></circle>
</g>
<circle cx="156" cy="110" r="5.5" fill="url(#post)" stroke="#55595F" stroke-width="1"></circle>
<circle cx="156" cy="230" r="5.5" fill="url(#post)" stroke="#55595F" stroke-width="1"></circle>
<circle cx="156" cy="350" r="5.5" fill="url(#post)" stroke="#55595F" stroke-width="1"></circle>
<circle cx="234" cy="110" r="5.5" fill="url(#post)" stroke="#55595F" stroke-width="1"></circle>
<circle cx="234" cy="230" r="5.5" fill="url(#post)" stroke="#55595F" stroke-width="1"></circle>
<circle cx="234" cy="350" r="5.5" fill="url(#post)" stroke="#55595F" stroke-width="1"></circle>
<g fill="none" stroke-linecap="round">
  <path d="M151.5 106.0 Q156 103.0 160.5 106.0" stroke="#C9CDD2" stroke-width="1.3"></path><path d="M151.5 108.2 Q156 105.2 160.5 108.2" stroke="#C9CDD2" stroke-width="1.3"></path><path d="M151.5 110.4 Q156 107.4 160.5 110.4" stroke="#C9CDD2" stroke-width="1.3"></path>
  <path d="M151.5 226.0 Q156 223.0 160.5 226.0" stroke="#C9CDD2" stroke-width="1.3"></path><path d="M151.5 228.2 Q156 225.2 160.5 228.2" stroke="#C9CDD2" stroke-width="1.3"></path><path d="M151.5 230.4 Q156 227.4 160.5 230.4" stroke="#C9CDD2" stroke-width="1.3"></path>
  <path d="M151.5 346.0 Q156 343.0 160.5 346.0" stroke="#C9CDD2" stroke-width="1.3"></path><path d="M151.5 348.2 Q156 345.2 160.5 348.2" stroke="#C9CDD2" stroke-width="1.3"></path><path d="M151.5 350.4 Q156 347.4 160.5 350.4" stroke="#C9CDD2" stroke-width="1.3"></path>
  <path d="M229.5 106.0 Q234 103.0 238.5 106.0" stroke="#C9CDD2" stroke-width="1.3"></path><path d="M229.5 108.2 Q234 105.2 238.5 108.2" stroke="#C9CDD2" stroke-width="1.3"></path><path d="M229.5 110.4 Q234 107.4 238.5 110.4" stroke="#C9CDD2" stroke-width="1.3"></path>
  <path d="M229.5 226.0 Q234 223.0 238.5 226.0" stroke="#C9CDD2" stroke-width="1.3"></path><path d="M229.5 228.2 Q234 225.2 238.5 228.2" stroke="#C9CDD2" stroke-width="1.3"></path><path d="M229.5 230.4 Q234 227.4 238.5 230.4" stroke="#C9CDD2" stroke-width="1.3"></path>
  <path d="M229.5 346.0 Q234 343.0 238.5 346.0" stroke="#C9CDD2" stroke-width="1.3"></path><path d="M229.5 348.2 Q234 345.2 238.5 348.2" stroke="#C9CDD2" stroke-width="1.3"></path><path d="M229.5 350.4 Q234 347.4 238.5 350.4" stroke="#C9CDD2" stroke-width="1.3"></path>
</g>
`;
