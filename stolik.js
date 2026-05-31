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
let hand_ids = [-1, -1, -1]
let table = [[-1, -1], [-1, -1], [-1, -1], [-1, -1], [-1, -1]]
let table_ids = [-1, -1, -1, -1, -1]

let stages = ["PREFLOP", "FLOP", "TURN", "RIVER"]


let used = {}
let figures = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "D", "K", "A"]
let colours = ["kier", "karo", "trefl", "pik"]

function random_card(){
	let x = Math.floor(Math.random()*13*4)
	while(used[x] == 1){
		x = Math.floor(Math.random()*13*4)
	}
	let col = colours[x%4]
	let fig = figures[Math.floor(x/4)]
	used[x] = 1
	return [x,[fig, col]]
}


function deal_cards(){
	used = {}
	hands = [[], [], []]
	table = [[-1, -1], [-1, -1], [-1, -1], [-1, -1], [-1, -1]]
	hand_ids = [-1, -1, -1]
	table_ids = [-1, -1, -1, -1, -1]
	
	for(let i=0; i<number_of_players; i++){
		card1 = random_card()
		card2 = random_card()
		
		hands[i] = [card1[1], card2[1]]
		hand_ids[i] = [card1[0], card2[0]]
	}
}


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
		to_call: (call_amt-called[i]),
		stage,
		called,
		in_game,
		all_in,
		hand: hands[i],
		hand_id: hand_ids[i],
		table
		
	}
	//console.log(data)
    send(bot, data);

    const action = await read(bot);
    console.log(`Bot${i} ( ${hands[i][0]} ; ${hands[i][1]} ):`, action);

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
	call_amt = 0;
	
	deal_cards()
	
	stage_id = 0
	stage = "preflop"

    for (let s = 0; s < 4; s++) {
		
		let i = sb
		let lp = 0
		
		if(s == 0){
			raise(sb, small_blind)
			raise(bb, big_blind)
		
			console.log(`Bot ${sb}: SMALL BLIND -> ${small_blind}`);
			console.log(`Bot ${bb}: BIG BLIND -> ${big_blind}`);
			
			i = (bb+1)%number_of_players
		}else if(s == 1){
			for(let c=0; c<3; c++){
				card = random_card()
				table[c] = card[1]
				table_ids[c] = card[0]
			}
		}else if(s == 2){
			card = random_card()
			table[3] = card[1]
			table_ids[3] = card[0]
		}else if(s == 3){
			card = random_card()
			table[4] = card[1]
			table_ids[4] = card[0]
		}
		console.log(stages[s], ": ");
		console.log(table)
		
		while(lp < number_of_players || called[i] < call_amt){
			if(in_game[i]){
				await turn(i)
			}
			i = (i+1)%number_of_players
			lp++
		}
		stage_id++
		stage = stages[stage_id]

    }

    //bots.forEach(b => b.kill());
}


(async () => {
    for(let g=1; g<10; g++){
    	console.log(`\nGAME NR. ${g}`)
        await game();
    }
})();






