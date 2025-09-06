#!/usr/bin/env node
"use strict";var e=require("create-create-x"),t=require("path"),c=(0,t.resolve)(__dirname,"..","templates"),r=`
This is a caveat!
You can change this in \`src/cli.ts\`.
`;(0,e.create)("create-something",{templateRoot:c,extra:{architecture:{type:"list",describe:"choose your fave os",choices:["macOS","Windows","Linux"],prompt:"if-no-arg"}},after:({answers:o})=>console.log(`Ok you chose ${o.architecture}.`),caveat:r}).then();
