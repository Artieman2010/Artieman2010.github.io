const instruction = document.getElementById('instruction');
const closeButton = document.getElementById('closeButton');
let initialDateTimeNow = Date.now() / 1000;
let breathCount = 0;

function updateInstruction() {
  let time = (Date.now() / 1000) - initialDateTimeNow;
  let cycle = time % 8; // 8 second cycle
  
  if (cycle < 4) {
    instruction.textContent = 'Breathe in...';
  } else {
    instruction.textContent = 'Breathe out...';
    // Check if we just started breathing out (completed one full breath)
    if (cycle >= 4 && cycle <= 4.1) {
      breathCount++;
      if (breathCount >= 1) {
        closeButton.classList.add('visible');
      }
    }
  }
}

closeButton.addEventListener('click', () => {
  window.close();
});

setInterval(updateInstruction, 100);