const { spawn } = require("child_process");

const bots = [
    spawn("./bot"),
    spawn("./bot"),
    spawn("./bot")
];

function send(bot, obj) {
    bot.stdin.write(JSON.stringify(obj) + "\n");
}

function read(bot) {
    return new Promise((resolve) => {
        bot.stdout.once("data", (data) => {
            resolve(data.toString().trim());
        });
    });
}

let number_of_players = 3
let small_blind = 10
let big_blind = 20


let dealer_id = 0

let balance = [500, 500, 500]
let called = [0, 0, 0]
let folded = 0
let in_game = [1, 1, 1]
let all_in = [0, 0, 0]
let pot = 0;
let call_amt = 10;
let stage = "preflop"
let hands = [[], [], []]
let table = [[], [], [], [], []]

let stages = ["PREFLOP", "FLOP", "TURN", "RIVER"]


function call(i){
	if(balance[i] >= call_amt-called[i]){
		balance[i] -= (call_amt-called[i])
		
		pot += call_amt-called[i]
		
		called[i] = call_amt
	}else{
		all_in[i] = 1
		
		pot += balance[i]-called[i]
		
		called[i] += balance[i]
		balance[i] = 0
	}
}

function raise(i, amt){
	amt = Math.min(amt, called[i]+balance[i]-call_amt)
	if(amt <= 0){
		call(i)
	}else{
		call_amt += amt
		call(i)
	}
}

function fold(i){
	in_game[i] = 0
	
}

async function turn(i) {
    const bot = bots[i];

	data = {
		id: i,
		number_of_players,
		balance: balance[i],
		dealer_id,
		pot,
		to_call: (call_amt-called[i]),//
		stage,
		called,
		in_game,
		all_in,
		hand: hands[i],
		table
		
	}
	//console.log(data)
    send(bot, data);

    const action = await read(bot);
    console.log(`Bot ${i}:`, action);

    if (action === "CALL") {
        call(i)
    } 
    else if (action.startsWith("RAISE")) {
        const amt = parseInt(action.split(" ")[1]);
        
        raise(i, amt)
    }else{
    	fold(i)
    }
}

async function game() {
	
	for(let i=0; i<number_of_players; i++){
		if(balance[i] < big_blind){
			console.log("one of the players has less than big blind")
			return
		}
	}
	
	dealer_id = (dealer_id+1)%number_of_players
	let sb = (dealer_id+1)%number_of_players
	let bb = (dealer_id+2)%number_of_players


	called = [0, 0, 0]
	in_game = [1, 1, 1]
	all_in = [0, 0, 0]
	pot = 0;
	call_amt = 10;
	stage = "preflop"

    for (let s = 0; s < 4; s++) {
        console.log(stages[s], ": ");
		
		let i = sb
		let lp = 0
		
		if(s == 0){
			raise(sb, small_blind)
			raise(bb, big_blind)
		
			console.log(`Bot ${sb}: SMALL BLIND -> ${small_blind}`);
			console.log(`Bot ${bb}: BIG BLIND -> ${big_blind}`);
			
			i = (bb+1)%number_of_players
		}
		
		while(lp < number_of_players || called[i] < call_amt){
			if(in_game[i]){
				await turn(i)
			}
			i = (i+1)%number_of_players
			lp++
		}

    }

    //bots.forEach(b => b.kill());
}


(async () => {
    for(let g=1; g<10; g++){
    	console.log(`\nGAME NR. ${g}`)
        await game();
    }
})();






