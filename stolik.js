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

let number_of_players = 3;
let small_blind = 10;
let big_blind = 20;
let dealer_id = 0;

let balance = [500, 500, 500];
let called = [0, 0, 0];
let folded = 0;
let in_game = [1, 1, 1];
let all_in = [0, 0, 0];

let pot = 0;
let call_amt = 10;
let stage = "preflop";

let hands = [[], [], []];
let hand_ids = [-1, -1, -1];

let table = [
	[-1, -1],
	[-1, -1],
	[-1, -1],
	[-1, -1],
	[-1, -1]
];

let table_ids = [-1, -1, -1, -1, -1];
let evaluation = [
	[-1, -1],
	[-1, -1],
	[-1, -1]
];

let stages = ["PREFLOP", "FLOP", "TURN", "RIVER"];
let used = {};

let figures = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "D", "K", "A"];
let colours = ["kier", "karo", "trefl", "pik"];

function random_card() {
	let x = Math.floor(Math.random() * 13 * 4);

	while (used[x] == 1) {
		x = Math.floor(Math.random() * 13 * 4);
	}

	let col = colours[x % 4];
	let fig = figures[Math.floor(x / 4)];

	used[x] = 1;

	return [x, [fig, col]];
}

function deal_cards() {
	used = {};
	hands = [[], [], []];
	table = [
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1]
	];

	hand_ids = [-1, -1, -1];
	table_ids = [-1, -1, -1, -1, -1];

	for (let i = 0; i < number_of_players; i++) {
		card1 = random_card();
		card2 = random_card();

		hands[i] = [card1[1], card2[1]];
		hand_ids[i] = [card1[0], card2[0]];
	}
	return;
}

let setups = [
	"High Card",
	"Pair",
	"Two Pair",
	"Three-of-a-Kind",
	"Straight",
	"Flush",
	"Full House",
	"Four-of-a-Kind",
	"Straight Flush",
	"Royal Flush"
]; //0-9

const values = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    "J": 11,
    "D": 12,
    "K": 13,
    "A": 14
};

function topCards(nums, excluded = [], count = 5){
    return [...nums]
        .filter(x => !excluded.includes(x))
        .sort((a,b) => b-a)
        .slice(0, count);
}

function evaluate(i){

    const cards = [...hands[i], ...table];

    let nums = cards
        .map(c => values[c[0]])
        .sort((a,b)=>b-a);

    let suits = cards.map(c => c[1]);

    let count = {};

    nums.forEach(v=>{
        count[v] = (count[v] || 0) + 1;
    });

    // ---------- FLUSH ----------

    let suitCount = {};
    let flushSuit = null;

    suits.forEach(s=>{
        suitCount[s] = (suitCount[s] || 0) + 1;
    });

    for(let s in suitCount){
        if(suitCount[s] >= 5){
            flushSuit = s;
            break;
        }
    }

    // ---------- STRAIGHT ----------

    let unique = [...new Set(nums)].sort((a,b)=>a-b);

    if(unique.includes(14)){
        unique.unshift(1); // wheel A2345
    }

    let straightHigh = -1;
    let streak = 1;

    for(let j=1;j<unique.length;j++){

        if(unique[j] === unique[j-1] + 1){

            streak++;

            if(streak >= 5){
                straightHigh = unique[j];
            }

        }else{
            streak = 1;
        }
    }

    // ---------- STRAIGHT FLUSH / ROYAL ----------

    if(flushSuit){

        let flushNums = cards
            .filter(c => c[1] === flushSuit)
            .map(c => values[c[0]]);

        let sf = [...new Set(flushNums)].sort((a,b)=>a-b);

        if(sf.includes(14)){
            sf.unshift(1);
        }

        let sfHigh = -1;
        let sfStreak = 1;

        for(let j=1;j<sf.length;j++){

            if(sf[j] === sf[j-1] + 1){

                sfStreak++;

                if(sfStreak >= 5){
                    sfHigh = sf[j];
                }

            }else{
                sfStreak = 1;
            }
        }

        if(sfHigh === 14){
            return [9];
        }

        if(sfHigh > 0){
            return [8, sfHigh];
        }
    }

    // ---------- FOUR OF A KIND ----------

    for(let v in count){

        if(count[v] === 4){

            const quad = Number(v);

            const kicker = Math.max(
                ...topCards(nums,[quad],1)
            );

            return [7, quad, kicker];
        }
    }

    // ---------- FULL HOUSE ----------

    let triples = Object.keys(count)
        .filter(v => count[v] >= 3)
        .map(Number)
        .sort((a,b)=>b-a);

    if(triples.length){

        let pairCandidates = Object.keys(count)
            .filter(v =>
                count[v] >= 2 &&
                Number(v) !== triples[0]
            )
            .map(Number)
            .sort((a,b)=>b-a);

        if(pairCandidates.length){

            return [
                6,
                triples[0],
                pairCandidates[0]
            ];
        }

        if(triples.length >= 2){

            return [
                6,
                triples[0],
                triples[1]
            ];
        }
    }

    // ---------- FLUSH ----------

    if(flushSuit){

        let flushCards = cards
            .filter(c => c[1] === flushSuit)
            .map(c => values[c[0]])
            .sort((a,b)=>b-a)
            .slice(0,5);

        return [5, ...flushCards];
    }

    // ---------- STRAIGHT ----------

    if(straightHigh > 0){

        return [4, straightHigh];
    }

    // ---------- THREE OF A KIND ----------

    if(triples.length){

        const trip = triples[0];

        const kickers = topCards(
            nums,
            [trip],
            2
        );

        return [
            3,
            trip,
            ...kickers
        ];
    }

    // ---------- PAIRS ----------

    let pairs = Object.keys(count)
        .filter(v => count[v] >= 2)
        .map(Number)
        .sort((a,b)=>b-a);

    // Two Pair

    if(pairs.length >= 2){

        const highPair = pairs[0];
        const lowPair = pairs[1];

        const kicker = topCards(
            nums,
            [highPair, lowPair],
            1
        )[0];

        return [
            2,
            highPair,
            lowPair,
            kicker
        ];
    }

    // One Pair

    if(pairs.length === 1){

        const pair = pairs[0];

        const kickers = topCards(
            nums,
            [pair],
            3
        );

        return [
            1,
            pair,
            ...kickers
        ];
    }

    // ---------- HIGH CARD ----------

    return [
        0,
        ...topCards(nums, [], 5)
    ];
}

function compare(a, b){

    const len = Math.max(a.length, b.length);

    for(let i=0;i<len;i++){

        const av = a[i] || 0;
        const bv = b[i] || 0;

        if(av > bv) return 1;
        if(av < bv) return -1;
    }

    return 0;
}

function find_winner(){

    // wygrana przez fold
    if(folded === number_of_players - 1){

        for(let i=0;i<number_of_players;i++){

            if(in_game[i]){
                return [i];
            }
        }
    }

    let winners = [];
    let best = null;

    for(let i=0;i<number_of_players;i++){

        if(!in_game[i]) continue;

        const ev = evaluate(i);

        console.log(
            `Player ${i}:`,
            hands[i],
            setups[ev[0]],
            ev
        );

        if(best === null){

            best = ev;
            winners = [i];

        }else{

            const cmp = compare(ev, best);

            if(cmp > 0){

                best = ev;
                winners = [i];

            }else if(cmp === 0){

                winners.push(i);
            }
        }
    }

    return winners;
}

function call(i) {
	if (balance[i] >= call_amt - called[i]) {
		balance[i] -= (call_amt - called[i]);
		pot += call_amt - called[i];
		called[i] = call_amt;
	} else {
		all_in[i] = 1;
		pot += balance[i] - called[i];
		called[i] += balance[i];
		balance[i] = 0;
	}
	return;
}

function raise(i, amt) {
	amt = Math.min(amt, called[i] + balance[i] - call_amt);

	if (amt <= 0) {
		call(i);
	} else {
		call_amt += amt;
		call(i);
	}
	return;
}

function fold(i) {
	in_game[i] = 0;
	folded++;
	return;
}

async function turn(i) {
	const bot = bots[i];

	data = {
		id: i,
		number_of_players,
		balance: balance[i],
		dealer_id,
		pot,
		to_call: (call_amt - called[i]),
		stage,
		called,
		in_game,
		all_in,
		hand: hands[i],
		hand_id: hand_ids[i],
		table
	};

	send(bot, data);

	const action = await read(bot);

	console.log(`Bot ${i} ( ${hands[i][0]} ; ${hands[i][1]} ):, ${action}`);

	if (action === "CALL") {
		call(i);
	} else if (action.startsWith("RAISE")) {
		const amt = parseInt(action.split(" ")[1]);
		raise(i, amt);
	} else {
		fold(i);
	}
}

async function game() {
	for (let i = 0; i < number_of_players; i++) {
		if (balance[i] < big_blind) {
			console.log("one of the players has less than big blind");
			return;
		}
	}

	dealer_id = (dealer_id + 1) % number_of_players;
	let sb = (dealer_id + 1) % number_of_players;
	let bb = (dealer_id + 2) % number_of_players;

	called = [0, 0, 0];
	in_game = [1, 1, 1];
	all_in = [0, 0, 0];

	pot = 0;
	call_amt = 0;

	evaluation = [
		[-1, -1],
		[-1, -1],
		[-1, -1]
	];

	deal_cards();

	stage_id = 0;
	stage = "preflop";

	for (let s = 0; s < 4; s++) {
		let i = sb;
		let lp = 0;

		console.log(stages[s], ": ");

		if (s == 0) {
			raise(sb, small_blind);
			raise(bb, big_blind);

			console.log(`Bot ${sb}: SMALL BLIND -> ${small_blind}`);
			console.log(`Bot ${bb}: BIG BLIND -> ${big_blind}`);

			i = (bb + 1) % number_of_players;

		} else if (s == 1) {
			for (let c = 0; c < 3; c++) {
				card = random_card();
				table[c] = card[1];
				table_ids[c] = card[0];
			}

		} else if (s == 2) {
			card = random_card();
			table[3] = card[1];
			table_ids[3] = card[0];

		} else if (s == 3) {
			card = random_card();
			table[4] = card[1];
			table_ids[4] = card[0];
		}
		
		console.log(table);

		while (lp < number_of_players || called[i] < call_amt) {
			if (in_game[i]) {
				await turn(i);
			}

			i = (i + 1) % number_of_players;
			lp++;
		}

		if (folded >= number_of_players - 1) {
			break;
		}

		stage_id++;
		stage = stages[stage_id];
	}
	for(let c=0; c<5; c++){
		if(table_ids[c] == -1){
			card = random_card();
			table[c] = card[1];
			table_ids[c] = card[0];
		}
	}
	console.log(table)

	let winners = find_winner();

	if(winners.length === 1){
		console.log(`WINNER: Bot ${winners[0]}`);
	}else{
		console.log(`SPLIT POT: Bot ${winners.join(", ")}`);
	}

	let share = Math.floor(pot / winners.length);
	let remainder = pot % winners.length;

	for(const w of winners){
		balance[w] += share;
	}

	for(let i=0;i<remainder;i++){
		balance[winners[i]]++;
	}
	
	console.log(balance)
	

	//bots.forEach(b => b.kill());
}

(async () => {
	for (let g = 1; g < 2; g++) {
		console.log(`\nGAME NR. ${g}`);
		await game();
	}
})();
