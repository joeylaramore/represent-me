const electionDate=new Date('2026-11-03T00:00:00-05:00');
const days=document.querySelector('[data-days]');
function updateCountdown(){days.textContent=Math.max(0,Math.ceil((electionDate-new Date())/86400000)).toLocaleString()} updateCountdown();setInterval(updateCountdown,60000);
const questions=[
 {text:'Which matters more when evaluating a public policy?',options:['The outcome it is intended to achieve','Whether government has the proper authority to act','The mechanism used to achieve it','I need more context']},
 {text:'How should your answers handle issues you do not know enough about?',options:['Skip them for now','Show me neutral background information','Mark them as a lower priority','I am not sure']},
 {text:'How important is government spending and debt in your decisions?',options:['A deal-breaker','Very important','Somewhat important','Not a major factor']}
];
let current=0,answers={};
const dialog=document.querySelector('#dialog'),question=document.querySelector('#question'),next=document.querySelector('#next'),back=document.querySelector('#back');
function render(){const q=questions[current];question.innerHTML=`<p class="question-progress">Question ${current+1} of ${questions.length}</p><h2 class="question-copy">${q.text}</h2><div>${q.options.map((o,i)=>`<label class="option"><input type="radio" name="answer" value="${i}" ${answers[current]===i?'checked':''}> ${o}</label>`).join('')}</div>`;back.style.visibility=current?'visible':'hidden';next.textContent=current===questions.length-1?'Save answers ✓':'Next →'}
document.querySelector('#start').addEventListener('click',()=>{current=0;render();dialog.showModal()});
next.addEventListener('click',()=>{const choice=document.querySelector('input[name=answer]:checked');if(!choice)return;answers[current]=Number(choice.value);if(current<questions.length-1){current++;render()}else{dialog.close();document.querySelector('#start').textContent='Explore again →'}});
back.addEventListener('click',()=>{if(current){current--;render()}});
document.querySelector('#privacy').addEventListener('click',()=>document.querySelector('#privacy-dialog').showModal());
