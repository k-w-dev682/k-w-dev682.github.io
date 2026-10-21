import test from 'node:test';
import assert from 'node:assert/strict';
import {isoDate,shiftDate,daysBetween,mistakesForReview,topicSignals,makeLearningPlan} from '../src/components/studycenter/learning176.mjs';
const DAY=86400000,now=Date.parse('2026-10-21T12:00:00Z');
const attempts=[
 {id:'m1',subject:'math1',topic:'functions',question:'Ile to jest?',given:'3',answer:'4',why:'Oblicz od początku',ok:false,date:now-2*DAY},
 {id:'m1',subject:'math1',topic:'functions',question:'Ile to jest?',given:'4',answer:'4',why:'',ok:true,date:now-DAY},
 {id:'m2',subject:'cpp',topic:'flow',question:'Pętla?',given:'5',answer:'4',why:'Zakres',ok:false,date:now-DAY},
 {id:'m1',subject:'math1',topic:'functions',question:'Ile to jest?',given:'4',answer:'4',why:'',ok:true,date:now},
];
const db={attempts,reviews:[{cardId:'cf01',rating:'good',date:now}],exams:[],planner:{subject:'math1',examDate:'2026-10-23',minutes:25}};
test('calendar handles leap years and whole local days',()=>{
 assert.equal(shiftDate('2028-02-28',1),'2028-02-29');
 assert.equal(shiftDate('2028-02-29',1),'2028-03-01');
 assert.equal(shiftDate('2026-02-29',1),'');
 assert.equal(daysBetween('2026-10-21','2026-10-23'),2);
 assert.equal(daysBetween('bad','2026-10-23'),null);
 assert.match(isoDate(new Date(2026,9,21)),/^2026-10-21$/);
});
test('mistakes remain after correct answer; spaced revisit is not falsely due',()=>{
 const list=mistakesForReview(db,now);
 assert.equal(list.length,2);
 const math=list.find(x=>x.id==='m1');
 assert.equal(math.correctStreak,2); assert.equal(math.due,false);
 assert.equal(math.recovered,true);assert.equal(math.given,'3');
 const cpp=list.find(x=>x.id==='m2'); assert.equal(cpp.due,true);assert.equal(cpp.recovered,false);
});
test('mistake filters, avoids duplicates and rejects never-failed attempts',()=>{
 assert.deepEqual(mistakesForReview(db,now,'physics'),[]);
 assert.equal(mistakesForReview(db,now,'math1').length,1);
 const goodOnly={attempts:[{...attempts[1],id:'unique'}]};
 assert.equal(mistakesForReview(goodOnly,now).length,0);
});
test('signals do not turn unknown subjects into mastery claims',()=>{
 const math=topicSignals(db,'math1');
 assert.ok(math.some(t=>t.accuracy===null&&t.reason.includes('Brak prób')));
 assert.ok(math.find(t=>t.topic==='functions').recent===3);
 assert.ok(topicSignals({attempts:[]},'cpp').every(t=>t.accuracy===null));
});
test('plan honors date, duration, subjects and exact sum of minutes',()=>{
 const {plan,until}=makeLearningPlan(db,{subject:'math1',examDate:'2026-10-23',minutes:25},'2026-10-21');
 assert.equal(until,2);assert.equal(plan.length,3);
 assert.equal(plan.at(-1).date,'2026-10-23');
 for(const day of plan){assert.equal(day.totalMinutes,day.reviewMinutes+day.practiceMinutes+day.reflectMinutes);
 assert.ok(day.topics.every(t=>t.subject==='math1'));}
 assert.equal(plan[0].attemptsRecorded,1);
});
test('date without deadline, past deadline and zero attempts produce safe schedules',()=>{
 const p=makeLearningPlan({attempts:[],reviews:[]},{subject:'all',examDate:'2026-10-20',minutes:5,horizon:7},'2026-10-21');
 assert.equal(p.until,null); assert.equal(p.plan.length,7);
 assert.equal(p.dailyMinutes,10);assert.ok(p.plan[0].topics.length>0);
});
test('review activity is not claimed as completed day',()=>{
 const {plan}=makeLearningPlan(db,{subject:'cpp',horizon:2},'2026-10-21');
 assert.equal(plan[0].attemptsRecorded,0);assert.equal(plan[0].reviewsRecorded,1);
 assert.equal(plan[0].activityRecorded,true);
 assert.equal(plan[1].activityRecorded,false);
 const other=makeLearningPlan(db,{subject:'math1',horizon:1},'2026-10-21').plan[0];
 assert.equal(other.reviewsRecorded,0);
});
