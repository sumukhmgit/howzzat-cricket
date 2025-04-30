// =====================================
// score.js — Howzatt! Cricket Scorekeeper
// Organized by: Utility | Setup | Live Match | Scorecard | Summary
// =====================================

// ========== Utility Functions ========== //
function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadData(key) {
  return JSON.parse(localStorage.getItem(key));
}

function clearData() {
  localStorage.clear();
}

// ========== Setup Page Logic ========== //
if (document.getElementById('setupForm')) {
  document.getElementById('setupForm').onsubmit = function (e) {
    e.preventDefault();

    const team1 = document.getElementById('team1').value.trim();
    const team2 = document.getElementById('team2').value.trim();
    const tossWinnerID = document.getElementById('tossWinner').value;
    const tossDecision = document.getElementById('tossDecision').value;
    const tossWinner = tossWinnerID === 'team1' ? team1 : team2;
    const tossLoser = tossWinnerID === 'team1' ? team2 : team1;
    const firstInningsTeam = tossDecision === 'bat' ? tossWinner : tossLoser;
    const secondInningsTeam = tossDecision === 'bat' ? tossLoser : tossWinner;
    const match = {
      team1,
      team2,
      tossWinner,
      tossDecision,
      overs: parseInt(prompt("Number of Overs for the Match"),10),
      currentInnings: 1,
      innings: [
        { team: firstInningsTeam, runs: 0, wickets: 0, balls: 0, batsmen: [], strikerIndex: 0, nonStrikerIndex: 1, freehit: false, bowlers: [], extras: 0, commentary: [] },
        { team: secondInningsTeam, runs: 0, wickets: 0, balls: 0, batsmen: [], strikerIndex: 0, nonStrikerIndex: 1, freehit: false, bowlers: [], extras: 0, commentary: [] }
      ]
    };
    saveData('match', match);
    window.location.href = 'live.html';
  };
}

// ========== Live Match Logic ========== //
if (window.location.pathname.includes('live.html')) {
  let match = loadData('match');
  if (!match) {
    window.location.href = 'setup.html';
  }

  const current = match.innings[match.currentInnings - 1];
  const opponent = match.innings[2 - match.currentInnings];
  
  // Initialize batsmen and bowler if not already done
  if (!current.batsmen.length) {
    let strikerName;
    while (!strikerName) {
      strikerName = prompt("Enter Strike Batsman Name:");
      if (!strikerName) alert("Striker name is required!");
    }
    let nonStrikerName;
    while (!nonStrikerName) {
      nonStrikerName = prompt("Enter Non-Strike Batsman Name:");
      if (!nonStrikerName) alert("Non-Striker name is required!");
    }
    let bowlerName;
    while (!bowlerName) {
      bowlerName = prompt("Enter Bowler Name:");
      if (!bowlerName) alert("Bowler name is required!");
    }
    current.batsmen.push(
      { name: strikerName, runs: 0, balls: 0, fours: 0, sixes: 0, out: false },
      { name: nonStrikerName, runs: 0, balls: 0, fours: 0, sixes: 0, out: false }
    );
    current.bowlers.push(
      { name: bowlerName, balls: 0, runs: 0, wickets: 0, maidens: 0, bool_maiden: true }
    );
    saveData('match', match);
  }
  
  // Setup striker and non-striker references
  let striker = current.batsmen[current.strikerIndex];
  let nonStriker = current.batsmen[current.nonStrikerIndex];
  let bowler = current.bowlers[current.bowlers.length - 1];
  
  function updateStrikerReferences() {
    striker = current.batsmen[current.strikerIndex];
    nonStriker = current.batsmen[current.nonStrikerIndex];
    bowler = current.bowlers[current.bowlers.length - 1];
  }

  function handleBallEvent(runs, description, wicket = false, wide = false, noball = false, bye = false, legbye = false) {

    if(current.freehit && !noball){
      current.freehit = false;
      current.runs += runs;

      if (wide || noball || bye || legbye) {
        current.extras += runs;
        if(wide) {
          current.freehit = true;
        }
      }
      else{
        striker.runs += runs;
        bowler.runs += runs;
      }

      const over = Math.floor(current.balls / 6);
      const ball = current.balls % 6;
      current.commentary.push(`<b>${over}.${ball}:</b> ${description}`);
      checkInningsEnd();
      updateStrikerReferences();
      saveData('match', match);
      updateDisplay();
      return;
    }
    else{
      // Update runs
      current.runs += runs;
      
      // Standard delivery
      if (!wide && !noball) {
        if (!bye && !legbye) {
          striker.runs += runs;
          bowler.runs += runs;
        }
        
        striker.balls++;
        current.balls++;
        bowler.balls++;
      }
      
      // Extras logic
      if (wide || noball || bye || legbye) {
        current.extras += runs;
      }
      
      // Over completion logic
      if (bowler.balls > 0 && bowler.balls % 6 === 0 && current.balls < match.overs * 6 && current.wickets < 10) {
        if (bowler.bool_maiden) bowler.maidens++;
        bowler.bool_maiden = true;
        getBowler();
        [current.strikerIndex, current.nonStrikerIndex] = [current.nonStrikerIndex, current.strikerIndex];
        updateStrikerReferences();
      }    

      // Odd runs logic
      if (runs % 2 === 1) {
        [current.strikerIndex, current.nonStrikerIndex] = [current.nonStrikerIndex, current.strikerIndex];
      }

      // Wicket logic
      if (wicket) {
        striker.out = true;
        current.wickets++;
        bowler.wickets++;
        
        if (current.wickets < 10) {
          const next = prompt("Enter Next Batsman Name:");
          current.batsmen.push({ name: next, runs: 0, balls: 0, fours: 0, sixes: 0, out: false });
          current.strikerIndex = current.batsmen.length - 1;
        }
      }

      // Add commentary
      const over = Math.floor(current.balls / 6);
      const ball = current.balls % 6;
      current.commentary.push(`<b>${over}.${ball}:</b> ${description}`);

      // Check for innings end
      checkInningsEnd();
      
      // Update references and save
      updateStrikerReferences();
      saveData('match', match);
      updateDisplay();
    }
  }

  function updateDisplay() {
    // Update score header
    if (match.currentInnings === 1) {
      document.getElementById('scoreHeader').innerText = 
        `${current.team} ${current.runs}/${current.wickets} (${Math.floor(current.balls/6)}.${current.balls%6}) vs. ${opponent.team}`;
    } else {
      document.getElementById('scoreHeader').innerText = 
        `${current.team} ${current.runs}/${current.wickets} (${Math.floor(current.balls/6)}.${current.balls%6}) vs. ${opponent.team} ${opponent.runs}/${opponent.wickets} (${Math.floor(opponent.balls/6)}.${opponent.balls%6})`;
    }

    // Update batsmen table
    const batterTable = document.getElementById('batterTable');
    if (batterTable) {
      let batterHTML = `<table><tr><th>Batsman</th><th>Runs</th><th>Balls</th><th>4s</th><th>6s</th><th>Strike Rate</th><th>Status</th></tr>`;
      
      if (striker) {
        const sr1 = striker.balls > 0 ? ((striker.runs / striker.balls) * 100).toFixed(2) : "0.00";
        batterHTML += `<tr><td>${striker.name} *</td><td>${striker.runs}</td><td>${striker.balls}</td><td>${striker.fours}</td><td>${striker.sixes}</td><td>${sr1}</td><td>Not Out</td></tr>`;
      }
      
      if (nonStriker) {
        const sr2 = nonStriker.balls > 0 ? ((nonStriker.runs / nonStriker.balls) * 100).toFixed(2) : "0.00";
        batterHTML += `<tr><td>${nonStriker.name}</td><td>${nonStriker.runs}</td><td>${nonStriker.balls}</td><td>${nonStriker.fours}</td><td>${nonStriker.sixes}</td><td>${sr2}</td><td>Not Out</td></tr>`;
      }
      
      batterHTML += `</table>`;
      batterTable.innerHTML = batterHTML;
    }

    // Update bowler section
    const bowlerSection = document.getElementById('bowlerSection');
    if (bowlerSection && bowler) {
      const econ = bowler.balls > 0 ? (bowler.runs / (bowler.balls / 6)).toFixed(2) : "0.00";
      bowlerSection.innerHTML = 
        `<b>Bowler:</b> ${bowler.name} <b>|</b> Overs: ${Math.floor(bowler.balls / 6)}.${bowler.balls % 6} <b>|</b> Maidens: ${bowler.maidens} <b>|</b> Runs: ${bowler.runs} <b>|</b> Wickets: ${bowler.wickets} <b>|</b> Economy: ${econ}`;
    }

    // Update run rates for second innings
    const runRates = document.getElementById("runRates");
    if (runRates) {
      if (match.currentInnings === 2) {
        const target = opponent.runs + 1;
        const ballsLeft = match.overs * 6 - current.balls;
        const crr = current.balls > 0 ? (current.runs / (current.balls / 6)).toFixed(2) : "0.00";
        const rrr = ballsLeft > 0 ? ((target - current.runs) / (ballsLeft / 6)).toFixed(2) : "N/A";
        runRates.innerText = `CRR: ${crr} | RRR: ${rrr}`;
      }
      else {
        const crr = current.balls > 0 ? (current.runs / (current.balls / 6)).toFixed(2) : "0.00";
        runRates.innerText = `CRR: ${crr}`;
      }
    }

    // Update commentary feed
    const commentaryFeed = document.getElementById("commentaryFeed");
    if (commentaryFeed) {
      let commentaryHTML = "<h3>Commentary</h3><ul>";
      for (let i = 0; i < current.commentary.length; i++) {
        commentaryHTML += `<li>${current.commentary[i]}</li>`;
      }
      commentaryHTML += "</ul>";
      commentaryFeed.innerHTML = commentaryHTML;
    }
  }

  function getBowler() {
    let newBowler;
    while (!newBowler) {
      newBowler = prompt("Enter Bowler Name:");
      if (!newBowler) alert("Bowler name is required!");
    }
    
    const alreadyBowled = current.bowlers.some(b => b.name === newBowler);
    
    if (alreadyBowled) {
      const same = confirm(`A bowler with the same name as ${newBowler} is found in the bowling attack! Do you continue with the same bowler?`);
      if (same) {
        const index = current.bowlers.findIndex(b => b.name === newBowler);
        // Remove the bowler from the array and add back to the end
        const [reuseBowler] = current.bowlers.splice(index, 1);
        current.bowlers.push(reuseBowler);
      } else {
        // Add a new bowler with the same name
        current.bowlers.push({ name: newBowler, balls: 0, runs: 0, wickets: 0, maidens: 0, bool_maiden: true });
        alert(`New bowler ${newBowler} added!`);
      }
    } else {
      // Add new bowler
      current.bowlers.push({ name: newBowler, balls: 0, runs: 0, wickets: 0, maidens: 0, bool_maiden: true });
    }
    
    // Update bowler reference
    bowler = current.bowlers[current.bowlers.length - 1];
  }

  function checkInningsEnd() {
    if (match.currentInnings === 1) {
      // First innings ends when overs are completed or all wickets down
      if (current.balls >= match.overs * 6 || current.wickets >= 10) {
        match.currentInnings = 2;
        saveData('match', match);
        window.location.reload();
      }
    } else {
      // Second innings ends when overs are completed, all wickets down, or target achieved
      if (current.balls >= match.overs * 6 || current.wickets >= 10 || current.runs > opponent.runs) {
        saveData('match', match);
        window.location.href = 'summary.html';
      }
    }
  }

  // Define event handlers for buttons
  window.addRuns = runs => {
    let description = '';
    if (runs === 0 || runs === 1) {
      description = `${bowler.name} to ${striker.name}, ${runs} run`;
    } else if (runs === 2 || runs === 3) {
      description = `${bowler.name} to ${striker.name}, ${runs} runs`;
    } else if (runs === 4) {
      striker.fours++;
      description = `${bowler.name} to ${striker.name}, FOUR!`;
    } else if (runs === 6) {
      striker.sixes++;
      description = `${bowler.name} to ${striker.name}, SIX! A Huge Hit by ${striker.name}`;
    }
    
    handleBallEvent(runs, description);
  };

  window.wicket = () => {
    handleBallEvent(0, `Wicket!! ${bowler.name} takes out ${striker.name}.`, true);
  };
  
  window.wide = () => {
    handleBallEvent(1, `${bowler.name} to ${striker.name}, Wide ball`, false, true);
  };
  
  window.isValidInteger = (value) => {
    return /^\d+$/.test(value);
  };
  
  window.noBall = () => {
    let inputValue = prompt("No Ball - How many runs?");
    while (!isValidInteger(inputValue)) {
      inputValue = prompt("Invalid Input!!\nPlease Enter valid integer for No-Ball runs.");
    }
    
    const runs = parseInt(inputValue, 10);
    handleBallEvent(runs+1, `${bowler.name} to ${striker.name}, No ball. FREE HIT Awarded.`, false, false, true);
    current.freehit = true;
  };

  window.byes = () => {
    let inputValue = prompt("Bye - How many runs?");
    while (!isValidInteger(inputValue)) {
      inputValue = prompt("Invalid Input!!\nPlease Enter valid integer for Bye runs.");
    }
    
    const runs = parseInt(inputValue, 10);
    handleBallEvent(runs, `${bowler.name} to ${striker.name}, ${runs} bye runs`, false, false, false, true);
  };

  window.legByes = () => {
    let inputValue = prompt("Leg Bye - How many runs?");
    while (!isValidInteger(inputValue)) {
      inputValue = prompt("Invalid Input!!\nPlease Enter valid integer for Leg Bye runs.");
    }
    
    const runs = parseInt(inputValue, 10);
    handleBallEvent(runs, `${bowler.name} to ${striker.name}, ${runs} leg bye runs`, false, false, false, false, true);
  };
  
  window.runOut = () => {
    // Show run out modal if it exists
    const runOutModal = document.getElementById("runOutModal");
    if (runOutModal) {
      // Populate the dropdown
      const select = document.getElementById("outBatterSelect");
      if (select) {
        select.innerHTML = `
          <option value="0">${striker.name} (Striker)</option>
          <option value="1">${nonStriker.name} (Non-Striker)</option>
        `;
      }
      runOutModal.style.display = "block";
    }
  };
  
  window.confirmRunOut = () => {
    const runOutModal = document.getElementById("runOutModal");
    if (runOutModal) {
      const outIndex = parseInt(document.getElementById("outBatterSelect").value);
      const runs = parseInt(document.getElementById("runOutRuns").value) || 0;
      const newBatterName = document.getElementById("newBatterName").value.trim();
      
      if (!newBatterName) {
        alert("Please enter the new batsman's name.");
        return;
      }
      
      const outBatter = outIndex === 0 ? striker : nonStriker;
      outBatter.out = true;
      
      current.runs += runs;
      current.balls++;
      current.wickets++;
      bowler.balls++;
      
      current.batsmen.push({name: newBatterName,runs: 0,balls: 0,fours: 0,sixes: 0,out: false});
      
      // Update indices
      if (outIndex === 0) {
        if(runs % 2 === 0){
          current.strikerIndex = current.nonStrikerIndex;
          current.nonStrikerIndex = current.batsmen.length - 1;
        }
        else {
          current.strikerIndex = current.batsmen.length - 1;
        }
      } else {
        if(runs % 2 === 0){
          current.strikerIndex = current.batsmen.length - 1;
          current.nonStrikerIndex = current.nonStrikerIndex;
        }
        else {
          current.nonStrikerIndex = current.batsmen.length - 1;
        }
      }
      
      const description = `Run Out! ${outBatter.name} out, ${runs} run(s) completed`;
      current.commentary.push(`<b>${Math.floor(current.balls/6)}.${current.balls%6}:</b> ${description}`);
      
      runOutModal.style.display = "none";
      document.getElementById("runOutRuns").value = "";
      document.getElementById("newBatterName").value = "";
      document.getElementById("outBatterSelect").selectedIndex = 0;
      
      checkInningsEnd();
      updateStrikerReferences();
      saveData('match', match);
      updateDisplay();
    }
  };
  
  window.closeRunOutModal = () => {
    const runOutModal = document.getElementById("runOutModal");
    runOutModal.style.display = "none";
    document.getElementById("runOutRuns").value = "";
    document.getElementById("newBatterName").value = "";
    document.getElementById("outBatterSelect").selectedIndex = 0;
  };

  window.goToScorecard = () => {
    window.location.href = 'scorecard.html';
  };
  
  // Initial update of the display
  updateDisplay();
}

// ========== Scorecard Logic ========== //
if (window.location.pathname.includes('scorecard.html')) {
  const match = loadData('match');
  if (!match) {
    window.location.href = 'setup.html';
  }

  function displayScorecard() {
    // Update score header if it exists
    const scoreHeader = document.getElementById('scoreHeader');
    if (scoreHeader) {
      scoreHeader.innerText = `${match.innings[0].team} ${match.innings[0].runs}/${match.innings[0].wickets} (${Math.floor(match.innings[0].balls/6)}.${match.innings[0].balls%6}) vs. ${match.innings[1].team} ${match.innings[1].runs}/${match.innings[1].wickets} (${Math.floor(match.innings[1].balls/6)}.${match.innings[1].balls%6})`;
    }

    match.innings.forEach((inn, index) => {
      // Create section for each innings
      const container = document.getElementById('battingScorecard') || document.querySelector('.scorecard-container');
      if (!container) return;
      
      // Create innings header
      const header = document.createElement('h3');
      header.innerText = `${inn.team} Batting`;
      container.appendChild(header);
      
      // Create batting table
      const batTable = document.createElement('table');
      let batHtml = `<tr><th>Name</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th><th>Status</th></tr>`;
      
      for (let b of inn.batsmen) {
        const sr = b.balls ? ((b.runs / b.balls) * 100).toFixed(2) : "0.00";
        const status = b.out ? "Out" : "Not Out";
        batHtml += `<tr>
          <td>${b.name}</td>
          <td>${b.runs}</td>
          <td>${b.balls}</td>
          <td>${b.fours}</td>
          <td>${b.sixes}</td>
          <td>${sr}</td>
          <td>${status}</td>
        </tr>`;
      }

      const total = inn.totalRuns || 0;
      const extras = inn.extras || 0;
      const wickets = inn.wickets || 0;
      
      batHtml += `<tr>
        <td><strong>Total</strong></td>
        <td><strong>${total}/${wickets}</strong></td>
        <td colspan="5"><strong>Extras: ${extras}</strong></td>
      </tr>`;
      
      batTable.innerHTML = batHtml;
      container.appendChild(batTable);
      
      // Create bowling header
      const bowlHeader = document.createElement('h3');
      bowlHeader.innerText = `${match.innings[1-index].team} Bowling`;
      container.appendChild(bowlHeader);
      
      // Create bowling table
      const bowlTable = document.createElement('table');
      let bowlHtml = `<tr><th>Name</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Eco</th></tr>`;
      
      for (let b of inn.bowlers) {
        const eco = b.balls ? (b.runs / (b.balls / 6)).toFixed(2) : "0.00";
        bowlHtml += `<tr>
          <td>${b.name}</td>
          <td>${Math.floor(b.balls/6)}.${b.balls%6}</td>
          <td>${b.maidens}</td>
          <td>${b.runs}</td>
          <td>${b.wickets}</td>
          <td>${eco}</td>
        </tr>`;
      }
      
      bowlTable.innerHTML = bowlHtml;
      container.appendChild(bowlTable);
      
      // Commentary section
      const commentarySection = document.createElement('div');
      commentarySection.innerHTML = `<h3>${inn.team} Commentary</h3><ul>`;
      
      for (let comment of inn.commentary) {
        commentarySection.innerHTML += `<li>${comment}</li>`;
      }
      
      commentarySection.innerHTML += `</ul>`;
      container.appendChild(commentarySection);
    });
  }

  // Call the display function
  displayScorecard();
  
  // If Live Page changes then reload the ScoreCard Page
  window.addEventListener('storage', function(event) {
    if (event.key === 'match') {
      console.log("Match data updated in another tab. Reloading...");
      location.reload();  // Reloads the entire page
    }
  });
  

  // Navigation button
  window.goToLive = () => {
    window.location.href = 'live.html';
  };
}

// ========== Summary Logic ========== //
if (window.location.pathname.includes('summary.html')) {
  const match = loadData('match');
  if (!match) {
    window.location.href = 'setup.html';
  }

  const [first, second] = match.innings;
  let result = "";

  if (first.runs > second.runs) {
    result = `${first.team} wins by ${first.runs - second.runs} runs!`;
  } else if (second.runs > first.runs) {
    const ballsLeft = match.overs * 6 - second.balls;
    const wicketsLeft = 10 - second.wickets;
    result = `${second.team} wins by ${wicketsLeft} wickets (${ballsLeft} balls left)!`;
  } else {
    result = "Match Tied!";
  }

  const resultEl = document.getElementById('result');
  if (resultEl) {
    resultEl.innerText = result;
  }
  
  window.resetMatch = () => {
    clearData();
    window.location.href = 'setup.html';
  };
}