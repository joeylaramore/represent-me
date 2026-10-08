const electionDate=new Date('2026-11-03T00:00:00-05:00');
const days=document.querySelector('[data-days]');
function updateCountdown(){days.textContent=Math.max(0,Math.ceil((electionDate-new Date())/86400000)).toLocaleString()} updateCountdown();setInterval(updateCountdown,60000);
const questions=[
 {topic:'Cost of living',text:'What should government do about high costs?',options:['Lower taxes and rules that raise costs','Target help to households under pressure','Increase supply and competition']},
 {topic:'Healthcare',text:'What should healthcare policy prioritize?',options:['Lower bills and prescription costs','Access for everyone who needs care','More choice, competition, and price transparency']},
 {topic:'Immigration',text:'What should immigration policy emphasize?',options:['Border enforcement and removals under law','More legal pathways and a workable process','Due process and limits on government power']},
 {topic:'Public safety and rights',text:'What should public safety policy emphasize?',options:['More tools and resources for law enforcement','Prevention, treatment, and community services','Stronger warrants, oversight, and due process']},
 {topic:'Education',text:'What should schools prioritize?',options:['Academic basics and measurable results','More choice for families','More resources and local control']},
 {topic:'Government power and money',text:'What check on government matters most?',options:['Congressional approval and clear limits','Balanced budgets and spending transparency','Independent courts and public oversight']}
];
let current=0,answers={};
window.representMeQuestions=questions;window.representMeAnswers=answers;
const dialog=document.querySelector('#dialog'),question=document.querySelector('#question'),next=document.querySelector('#next'),back=document.querySelector('#back');
function render(){const q=questions[current];question.innerHTML=`<p class="question-progress">Question ${current+1} of ${questions.length} · ${q.topic}</p><h2 class="question-copy">${q.text}</h2><div>${q.options.map((o,i)=>`<label class="option"><input type="radio" name="answer" value="${i}" ${answers[current]===i?'checked':''}> ${o}</label>`).join('')}<input class="visually-hidden" type="radio" name="answer" value="-1" ${answers[current]===-1?'checked':''}><button type="button" class="question-skip" id="skip-question">Skip this question</button></div>`;back.style.visibility=current?'visible':'hidden';next.textContent=current===questions.length-1?'Finish →':'Next →';document.querySelector('#skip-question').addEventListener('click',()=>{document.querySelector('input[name="answer"][value="-1"]').checked=true;next.click()})}
document.querySelector('#start').addEventListener('click',()=>{current=0;render();dialog.showModal()});
next.addEventListener('click',()=>{const choice=document.querySelector('input[name=answer]:checked');if(!choice)return;answers[current]=Number(choice.value);window.representMeAnswers=answers;if(current<questions.length-1){current++;render()}else{dialog.close();document.querySelector('#beliefs-status').textContent='Answers are only used while this page is open; they are not saved.';document.querySelector('#start').textContent='Review questionnaire ✓'if(window.renderValueMatches)window.renderValueMatches(answers)}});
back.addEventListener('click',()=>{if(current){current--;render()}});
document.querySelector('#privacy').addEventListener('click',()=>document.querySelector('#privacy-dialog').showModal());

document.querySelector('#clear-beliefs').addEventListener('click',()=>{answers={};window.representMeAnswers=answers;document.querySelector('#beliefs-status').textContent='Questionnaire answers cleared.';document.querySelector('#start').textContent='Take questionnaire →';document.querySelector('#value-match').hidden=true});
