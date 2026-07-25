/* core/data/trade.js -- window.AD_TRADE

   Export composition, top-5 exporter tables and revealed comparative
   advantage for the TRADLE / PICK 5 / CONNECTRADE cabinets.

   SOURCE  OEC olap-proxy (https://oec.world/api/olap-proxy/data.jsonrecords),
           cube trade_i_baci_a_92 = CEPII BACI, HS6 Rev. 1992, Year 2023.
           BACI is CEPII's mirror-reconciled rebuild of UN Comtrade; values
           are USD FOB. RCA is Balassa, computed locally from the same rows
           so shares and ranks in this file can never disagree.
   SCRIPT  _build/gen_trade.py  (re-runnable, deterministic, stdlib only)

   countries[] .i ISO2  .total USD  .hint one-liner
               .items[] {name, hs (HS2 chapter), hs4, share, colour}
               shares sum to 1 including the trailing "Other" remainder.
   top5[]      .hs4 .name .colour .n (how many countries export it at all)
               .world (world trade USD)  .top [[ISO2, USD] x5] rank 1..5
   rca{ISO2}   top products by revealed comparative advantage, >=0.5%% of
               that country's exports, RCA-descending.
   sections{}  HS section id -> {name, colour}; "0" = the Other remainder.
*/
window.AD_TRADE = {"year":2023,"source":"OEC olap-proxy, cube trade_i_baci_a_92 (CEPII BACI, HS6 Rev. 1992), Year 2023; RCA computed locally (Balassa). Built by _build/gen_trade.py.","cube":"trade_i_baci_a_92","worldTotal":22958882317274,"sections":{"1":{"name":"Animal","colour":"#ff7a9c"},"2":{"name":"Vegetable","colour":"#4fd06a"},"3":{"name":"Fats & Oils","colour":"#9fd93a"},"4":{"name":"Foodstuffs","colour":"#ffc247"},"5":{"name":"Minerals","colour":"#b07a3c"},"6":{"name":"Chemicals","colour":"#b18cff"},"7":{"name":"Plastics & Rubber","colour":"#d9a3ff"},"8":{"name":"Hides & Leather","colour":"#a35c4a"},"9":{"name":"Wood","colour":"#2f9e6e"},"10":{"name":"Paper","colour":"#7fd6b0"},"11":{"name":"Textiles","colour":"#4fd8ff"},"12":{"name":"Footwear & Headwear","colour":"#3a9bd9"},"13":{"name":"Stone & Glass","colour":"#9fb4c9"},"14":{"name":"Precious Metals","colour":"#ffd84f"},"15":{"name":"Metals","colour":"#8c93a8"},"16":{"name":"Machines","colour":"#5b8dff"},"17":{"name":"Transport","colour":"#3d5fc4"},"18":{"name":"Instruments","colour":"#ff4fa3"},"19":{"name":"Weapons","colour":"#e03a3a"},"20":{"name":"Miscellaneous","colour":"#c9a0dc"},"21":{"name":"Arts & Antiques","colour":"#ff9e6b"},"0":{"name":"Other","colour":"#4a3a7d"}},"countries":[{"i":"US","total":1900553699307,"items":[{"name":"Crude Petroleum","hs":"27","hs4":"2709","share":0.066,"colour":"5"},{"name":"Refined Petroleum","hs":"27","hs4":"2710","share":0.0568,"colour":"5"},{"name":"Petroleum Gas","hs":"27","hs4":"2711","share":0.0459,"colour":"5"},{"name":"Cars","hs":"87","hs4":"8703","share":0.0364,"colour":"17"},{"name":"Gas Turbines","hs":"84","hs4":"8411","share":0.0359,"colour":"16"},{"name":"Vaccines, blood, antisera, toxins and cultures","hs":"30","hs4":"3002","share":0.0281,"colour":"6"},{"name":"Packaged Medicaments","hs":"30","hs4":"3004","share":0.0226,"colour":"6"},{"name":"Motor vehicles; parts and accessories (8701 to 8705)","hs":"87","hs4":"8708","share":0.0216,"colour":"17"},{"name":"Planes, Helicopters, and/or Spacecraft","hs":"88","hs4":"8802","share":0.0215,"colour":"17"},{"name":"Integrated Circuits","hs":"85","hs4":"8542","share":0.0209,"colour":"16"},{"name":"Medical Instruments","hs":"90","hs4":"9018","share":0.0186,"colour":"18"},{"name":"Other","hs":"","hs4":"","share":0.6257,"colour":"0"}],"hint":"Machines = 22% of a $1.9T export basket. Most distinctive: Gas Turbines (4.0x the world average share). North America."}],"top5":[{"hs4":"2846","name":"Rare-Earth Metal Compounds","colour":"6","n":83,"world":3484303405,"top":[["MM",1441901598],["MY",531321399],["CN",513239225],["JP",261544113],["US",155463775]]}],"rca":{"US":[{"name":"Gas Turbines","hs4":"8411","rca":4.0,"share":0.0359,"colour":"16"},{"name":"Aircraft parts (gliders, balloons, and powered aircraft)","hs4":"8803","rca":3.7,"share":0.0143,"colour":"17"},{"name":"Soybeans","hs4":"1201","rca":3.7,"share":0.0152,"colour":"2"},{"name":"Planes, Helicopters, and/or Spacecraft","hs4":"8802","rca":3.4,"share":0.0215,"colour":"17"},{"name":"Corn","hs4":"1005","rca":3.0,"share":0.0076,"colour":"2"},{"name":"Chemical Analysis Instruments","hs4":"9027","rca":2.6,"share":0.0064,"colour":"18"}]}};
