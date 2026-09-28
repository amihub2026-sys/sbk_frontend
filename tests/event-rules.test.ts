import test from "node:test";
import assert from "node:assert/strict";
import { ageInMonths, categoryFor, indiaDate, slotsOverlap, validateCategories, validateSelection, validateStudent, csvEncode } from "../src/app/core/utils/event-rules";
import { createDemoState } from "../src/app/core/data/demo-data";
import type { Competition, Registration, Slot } from "../src/app/core/models/event.models";

const state=createDemoState();

test("client seed has 12 exact age categories",()=>{
  assert.equal(state.categories.length,12);
  assert.deepEqual([state.categories[0].minMonths,state.categories[0].maxMonths],[48,72]);
  assert.deepEqual([state.categories[11].minMonths,state.categories[11].maxMonths],[192,204]);
});

test("category assignment changes on birthday boundary",()=>{
  assert.equal(categoryFor("2020-09-25","2026-09-24",state.categories)?.id,"cat-1");
  assert.equal(categoryFor("2020-09-24","2026-09-24",state.categories)?.id,"cat-2");
  assert.equal(categoryFor("2022-09-25","2026-09-24",state.categories),undefined);
  assert.equal(categoryFor("2009-09-24","2026-09-24",state.categories),undefined);
});

test("completed months and invalid dates",()=>{
  assert.equal(ageInMonths("2020-09-24","2026-09-23"),71);
  assert.equal(ageInMonths("2020-09-24","2026-09-24"),72);
  for(const dob of ["bad","2025-02-29","2026-13-01","2027-01-01"]) assert.equal(ageInMonths(dob,"2026-09-24"),-1);
});

test("registration date uses India timezone",()=>assert.equal(indiaDate(new Date("2026-09-24T19:00:00Z")),"2026-09-25"));

test("slot overlap rules",()=>{
  const a:Slot={id:"a",name:"A",date:"2026-10-01",start:"10:00",end:"11:00",venue:"Hall A"};
  const b:Slot={id:"b",name:"B",date:"2026-10-01",start:"11:00",end:"12:00",venue:"Hall B"};
  const c:Slot={id:"c",name:"C",date:"2026-10-01",start:"10:30",end:"11:30",venue:"Hall C"};
  assert.equal(slotsOverlap(a,b),false); assert.equal(slotsOverlap(a,c),true);
});

test("selection enforces max, age, capacity and schedule conflicts",()=>{
  const slots:Slot[]=[{id:"s1",name:"S1",date:"2026-10-01",start:"10:00",end:"11:00",venue:"A"},{id:"s2",name:"S2",date:"2026-10-01",start:"11:00",end:"12:00",venue:"B"},{id:"s3",name:"S3",date:"2026-10-01",start:"10:30",end:"11:30",venue:"C"}];
  const base=(id:string,slotId:string,cats:string[],capacity=10):Competition=>({id,name:id,tamil:id,kind:"Art",categoryIds:cats,fee:0,slotId,capacity,status:"Open",instructions:"",instructionsTa:"",language:"",image:""});
  const comps=[base("a","s1",["cat-1"]),base("b","s2",["cat-1"]),base("c","s3",["cat-1"]),base("quiz","s2",["cat-9"]),base("full","s2",["cat-1"],1)];
  assert.equal(validateSelection(["a","b"],"cat-1",comps,slots,[],2),null);
  assert.match(validateSelection(["a","b","c"],"cat-1",comps,slots,[],2)!,/maximum/);
  assert.match(validateSelection(["quiz"],"cat-1",comps,slots,[],2)!,/age group/);
  assert.match(validateSelection(["a","c"],"cat-1",comps,slots,[],2)!,/overlap/);
  const reg={id:"r",applicationNo:"X",categoryId:"cat-1",applicationDate:"2026-09-24",submittedOn:"",competitionIds:["full"],feeSnapshot:[],total:0,payment:"Paid",paymentMethod:"Online",checkedInAt:null,qrToken:"q",language:"en",source:"Online",cancelled:false,approval:"Approved",reviewNote:"",emailStatus:"Ready",approvedAt:null,name:"A",fatherName:"B",school:"C",dob:"2020-01-01",email:"a@b.com",phone:"9876543210"} as Registration;
  assert.match(validateSelection(["full"],"cat-1",comps,slots,[reg],2)!,/full/);
});

test("category administration prevents overlaps",()=>{
  assert.equal(validateCategories(state.categories),null);
  assert.match(validateCategories([{id:"a",name:"a",nameTa:"",minMonths:48,maxMonths:73},{id:"b",name:"b",nameTa:"",minMonths:72,maxMonths:84}])!,/overlap/);
});

test("student validation and CSV formula escaping",()=>{
  assert.equal(validateStudent({name:"Arun",fatherName:"Kumar",school:"SBK",dob:"2020-01-01",email:"a@b.com",phone:"9876543210"}),null);
  assert.ok(validateStudent({name:" ",fatherName:"Kumar",school:"SBK",dob:"2020-01-01",email:"a@b.com",phone:"9876543210"}));
  const csv=csvEncode([["A,\"B","=1+1","  @SUM(A1)"]]); assert.ok(csv.includes("'=1+1")); assert.ok(csv.includes("'  @SUM"));
});
