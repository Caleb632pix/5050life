import { useState, useMemo, useCallback } from "react";

// ─── COMPLETE GAMES DATABASE ─────────────────────────────────────────────────
const CATEGORIES = {
  battle_royale:  { label: "Battle Royale",      icon: "🎯", color: "#CC0000" },
  strategy_board: { label: "Strategy & Board",   icon: "♟️", color: "#0033CC" },
  party_casual:   { label: "Party & Casual",     icon: "🎉", color: "#F57C00" },
  racing:         { label: "Racing",             icon: "🏎️", color: "#00C853" },
  sports:         { label: "Sports Games",       icon: "⚽", color: "#7B1FA2" },
  battle_action:  { label: "Battle & Action",    icon: "⚔️", color: "#C62828" },
  survival:       { label: "Survival & Sandbox", icon: "🏕️", color: "#2E7D32" },
  puzzle_brain:   { label: "Puzzle & Brain",     icon: "🧠", color: "#0288D1" },
  other:          { label: "RPG & Strategy",     icon: "🐉", color: "#AD1457" },
};

const BET_TYPES = {
  match_winner:      "Match Winner",
  kill_count:        "Kill Count O/U",
  placement:         "Final Placement",
  first_blood:       "First Blood",
  mvp:               "MVP Player",
  tournament_winner: "Tournament Winner",
  points_total:      "Points Total",
  race_winner:       "Race Winner",
  fastest_lap:       "Fastest Lap",
  score_diff:        "Score Difference",
  custom_challenge:  "Custom Challenge",
  head_to_head:      "1v1 Head-to-Head",
};

const GAMES = [
  // BATTLE ROYALE
  { id:"pubg-mobile",    name:"PUBG Mobile",              short:"PUBG",         cat:"battle_royale",  icon:"🔫", g:["#F57C00","#E65100"], players:3241, bets:127, prize:500,  popular:true,  verified:true,  tags:["FPS","Battle Royale"],  desc:"The original Battle Royale on mobile.", types:["placement","kill_count","first_blood","head_to_head","custom_challenge"] },
  { id:"codm",           name:"Call of Duty: Mobile",     short:"COD Mobile",   cat:"battle_royale",  icon:"💀", g:["#212121","#424242"], players:2987, bets:108, prize:400,  popular:true,  verified:true,  tags:["FPS","Multiplayer"],    desc:"Fan-favourite COD gameplay on mobile.", types:["match_winner","kill_count","mvp","head_to_head","custom_challenge"] },
  { id:"free-fire",      name:"Free Fire",                short:"Free Fire",    cat:"battle_royale",  icon:"🔥", g:["#FF6D00","#DD2C00"], players:4102, bets:193, prize:350,  popular:true,  verified:true,  tags:["Battle Royale"],       desc:"10-minute intense Battle Royale.",       types:["placement","kill_count","first_blood","head_to_head","custom_challenge"] },
  { id:"free-fire-max",  name:"Free Fire MAX",            short:"FF MAX",       cat:"battle_royale",  icon:"🔥", g:["#BF360C","#E64A19"], players:1823, bets:74,  prize:300,  popular:false, verified:true,  tags:["Battle Royale"],       desc:"Enhanced Free Fire with better graphics.", types:["placement","kill_count","head_to_head","custom_challenge"] },
  { id:"among-us",       name:"Among Us",                 short:"Among Us",     cat:"battle_royale",  icon:"🪐", g:["#7B1FA2","#4A148C"], players:892,  bets:43,  prize:100,  popular:false, verified:false, tags:["Social","Deduction"],  desc:"Find the impostors before they eliminate everyone.", types:["match_winner","custom_challenge","head_to_head"] },
  { id:"brawl-stars",    name:"Brawl Stars",              short:"Brawl Stars",  cat:"battle_royale",  icon:"⭐", g:["#1565C0","#0D47A1"], players:2156, bets:89,  prize:250,  popular:true,  verified:true,  tags:["MOBA","3v3"],          desc:"Fast-paced 3v3 and Battle Royale.", types:["match_winner","kill_count","mvp","tournament_winner","custom_challenge"] },
  { id:"clash-royale",   name:"Clash Royale",             short:"Clash Royale", cat:"battle_royale",  icon:"👑", g:["#7B1FA2","#AB47BC"], players:1743, bets:62,  prize:200,  popular:true,  verified:true,  tags:["Strategy","1v1"],      desc:"Real-time card-based tower defence battles.", types:["match_winner","tournament_winner","score_diff","custom_challenge"] },
  { id:"clash-of-clans", name:"Clash of Clans",           short:"CoC",          cat:"battle_royale",  icon:"⚔️", g:["#1B5E20","#2E7D32"], players:1289, bets:48,  prize:150,  popular:false, verified:true,  tags:["Strategy","Wars"],     desc:"Build your village and battle players worldwide.", types:["match_winner","tournament_winner","custom_challenge"] },
  { id:"mobile-legends", name:"Mobile Legends: Bang Bang", short:"MLBB",        cat:"battle_royale",  icon:"🌟", g:["#0033CC","#1565C0"], players:5234, bets:247, prize:1000, popular:true,  verified:true,  tags:["MOBA","5v5"],          desc:"The #1 MOBA on mobile. 5v5 battles.", types:["match_winner","mvp","kill_count","tournament_winner","custom_challenge"] },
  { id:"wild-rift",      name:"LoL: Wild Rift",           short:"Wild Rift",    cat:"battle_royale",  icon:"🦁", g:["#0033CC","#C9AA71"], players:3876, bets:156, prize:750,  popular:true,  verified:true,  tags:["MOBA","Esports"],      desc:"Riot's mobile MOBA with 80+ champions.", types:["match_winner","mvp","kill_count","first_blood","tournament_winner","custom_challenge"] },
  // STRATEGY & BOARD
  { id:"ludo-king",      name:"Ludo King",                short:"Ludo",         cat:"strategy_board", icon:"🎲", g:["#F44336","#E91E63"], players:2341, bets:198, prize:100,  popular:true,  verified:true,  tags:["Board","Classic"],     desc:"The classic Ludo board game online.",    types:["match_winner","custom_challenge","head_to_head"] },
  { id:"chess",          name:"Chess.com",                short:"Chess",        cat:"strategy_board", icon:"♟️", g:["#795548","#4E342E"], players:4521, bets:312, prize:500,  popular:true,  verified:true,  tags:["Chess","Strategy"],    desc:"The world's most popular chess platform.", types:["match_winner","tournament_winner","head_to_head","custom_challenge"] },
  { id:"8-ball-pool",    name:"8 Ball Pool",              short:"8 Ball Pool",  cat:"strategy_board", icon:"🎱", g:["#1A237E","#283593"], players:3102, bets:234, prize:300,  popular:true,  verified:true,  tags:["Pool","Sports"],       desc:"The world's #1 pool game.",              types:["match_winner","tournament_winner","head_to_head","custom_challenge"] },
  { id:"uno",            name:"UNO!",                     short:"UNO",          cat:"strategy_board", icon:"🃏", g:["#E53935","#FF9800"], players:1876, bets:143, prize:150,  popular:true,  verified:false, tags:["Cards","Party"],       desc:"The classic card game, reimagined.",     types:["match_winner","head_to_head","custom_challenge"] },
  { id:"monopoly-go",    name:"Monopoly GO!",             short:"Monopoly",     cat:"strategy_board", icon:"🎩", g:["#1B5E20","#388E3C"], players:987,  bets:67,  prize:100,  popular:false, verified:false, tags:["Board","Classic"],     desc:"The fast-paced mobile Monopoly.",        types:["match_winner","custom_challenge"] },
  { id:"risk",           name:"Risk: Global Domination",  short:"Risk",         cat:"strategy_board", icon:"🌍", g:["#CC0000","#0033CC"], players:743,  bets:45,  prize:200,  popular:false, verified:false, tags:["Strategy","Classic"],  desc:"World domination strategy game.",        types:["match_winner","tournament_winner","custom_challenge"] },
  { id:"checkers",       name:"Checkers Online",          short:"Checkers",     cat:"strategy_board", icon:"⚫", g:["#212121","#616161"], players:456,  bets:23,  prize:50,   popular:false, verified:false, tags:["Board","Strategy"],    desc:"Classic draughts against players worldwide.", types:["match_winner","head_to_head","custom_challenge"] },
  { id:"backgammon",     name:"Backgammon Live",          short:"Backgammon",   cat:"strategy_board", icon:"🎯", g:["#4A148C","#6A1B9A"], players:612,  bets:31,  prize:100,  popular:false, verified:false, tags:["Board","Dice"],        desc:"Millions of online backgammon players.", types:["match_winner","tournament_winner","head_to_head"] },
  { id:"dominoes",       name:"Dominoes Online",          short:"Dominoes",     cat:"strategy_board", icon:"🁣", g:["#37474F","#546E7A"], players:389,  bets:19,  prize:50,   popular:false, verified:false, tags:["Board","Tiles"],       desc:"Classic dominoes with multiple variants.", types:["match_winner","head_to_head","custom_challenge"] },
  { id:"wordfeud",       name:"Wordfeud",                 short:"Wordfeud",     cat:"strategy_board", icon:"🔤", g:["#0288D1","#0097A7"], players:523,  bets:28,  prize:75,   popular:false, verified:false, tags:["Word","Strategy"],     desc:"Scrabble-style word game.",              types:["match_winner","points_total","head_to_head"] },
  // PARTY & CASUAL
  { id:"stumble-guys",   name:"Stumble Guys",             short:"Stumble Guys", cat:"party_casual",   icon:"🏃", g:["#F57C00","#FFA726"], players:1543, bets:87,  prize:150,  popular:true,  verified:false, tags:["Party","Casual"],      desc:"Knock out opponents across crazy obstacle courses.", types:["match_winner","placement","custom_challenge"] },
  { id:"fall-guys",      name:"Fall Guys",                short:"Fall Guys",    cat:"party_casual",   icon:"👑", g:["#FF4081","#F50057"], players:1209, bets:64,  prize:200,  popular:true,  verified:false, tags:["Party","Battle Royale"], desc:"The original jelly bean battle royale.", types:["match_winner","placement","custom_challenge"] },
  { id:"heads-up",       name:"Heads Up!",                short:"Heads Up",     cat:"party_casual",   icon:"💭", g:["#E91E63","#F06292"], players:678,  bets:34,  prize:50,   popular:false, verified:false, tags:["Party","Trivia"],      desc:"Ellen's hilarious charades-style game.", types:["match_winner","points_total","custom_challenge"] },
  { id:"psych",          name:"Psych! Outwit Your Friends", short:"Psych!",     cat:"party_casual",   icon:"🧠", g:["#7B1FA2","#9C27B0"], players:456,  bets:21,  prize:50,   popular:false, verified:false, tags:["Party","Bluffing"],    desc:"Fool your friends with fake answers.",   types:["match_winner","points_total","head_to_head"] },
  { id:"spaceteam",      name:"Spaceteam",                short:"Spaceteam",    cat:"party_casual",   icon:"🚀", g:["#1A237E","#0D47A1"], players:234,  bets:12,  prize:30,   popular:false, verified:false, tags:["Party","Co-op"],       desc:"Cooperative shouting space game.",       types:["match_winner","custom_challenge"] },
  { id:"bombsquad",      name:"BombSquad",                short:"BombSquad",    cat:"party_casual",   icon:"💣", g:["#FF5722","#E64A19"], players:312,  bets:18,  prize:75,   popular:false, verified:false, tags:["Party","Action"],      desc:"Multiplayer mayhem — bomb your way to victory.", types:["match_winner","kill_count","head_to_head"] },
  { id:"houseparty",     name:"Houseparty Games",         short:"Houseparty",   cat:"party_casual",   icon:"🏠", g:["#FF9800","#F44336"], players:198,  bets:9,   prize:30,   popular:false, verified:false, tags:["Party","Video Chat"],  desc:"Play games with friends during video calls.", types:["match_winner","custom_challenge"] },
  { id:"truth-dare",     name:"Truth or Dare",            short:"Truth or Dare", cat:"party_casual",  icon:"🎭", g:["#C62828","#B71C1C"], players:876,  bets:67,  prize:50,   popular:false, verified:false, tags:["Party","Social"],      desc:"The classic party game digitized.",      types:["custom_challenge"] },
  { id:"draw-something", name:"Draw Something",           short:"Draw Something", cat:"party_casual", icon:"🎨", g:["#F06292","#E91E63"], players:534,  bets:27,  prize:50,   popular:false, verified:false, tags:["Drawing","Party"],     desc:"Pictionary-style drawing and guessing.", types:["match_winner","points_total","head_to_head"] },
  { id:"pictionary-air", name:"Pictionary Air",           short:"Pictionary",   cat:"party_casual",   icon:"✏️", g:["#1565C0","#0D47A1"], players:287,  bets:14,  prize:40,   popular:false, verified:false, tags:["Drawing","AR"],        desc:"Draw in the air with your phone.",       types:["match_winner","custom_challenge"] },
  // RACING
  { id:"asphalt-9",      name:"Asphalt 9: Legends",       short:"Asphalt 9",    cat:"racing",         icon:"🏎️", g:["#B71C1C","#C62828"], players:1876, bets:123, prize:300,  popular:true,  verified:true,  tags:["Racing","Arcade"],     desc:"Most stunning mobile racing game.",      types:["race_winner","fastest_lap","head_to_head","custom_challenge"] },
  { id:"mario-kart",     name:"Mario Kart Tour",          short:"Mario Kart",   cat:"racing",         icon:"🍄", g:["#E53935","#FDD835"], players:2341, bets:178, prize:250,  popular:true,  verified:true,  tags:["Racing","Nintendo"],   desc:"Nintendo's kart racing series on mobile.", types:["race_winner","points_total","head_to_head","custom_challenge"] },
  { id:"real-racing-3",  name:"Real Racing 3",            short:"Real Racing 3", cat:"racing",        icon:"🏁", g:["#212121","#F57C00"], players:987,  bets:67,  prize:200,  popular:false, verified:false, tags:["Racing","Simulation"], desc:"Award-winning real-world circuits.",     types:["race_winner","fastest_lap","head_to_head"] },
  { id:"carx-drift",     name:"CarX Drift Racing 2",      short:"CarX Drift",   cat:"racing",         icon:"💨", g:["#37474F","#FF5722"], players:654,  bets:43,  prize:150,  popular:false, verified:false, tags:["Racing","Drifting"],   desc:"Ultimate drift racing experience.",     types:["race_winner","head_to_head","custom_challenge"] },
  { id:"nfs-mobile",     name:"Need for Speed: No Limits", short:"NFS Mobile",  cat:"racing",         icon:"⚡", g:["#000000","#F57C00"], players:876,  bets:54,  prize:200,  popular:false, verified:false, tags:["Racing","Street"],     desc:"Underground street racing.",             types:["race_winner","head_to_head","custom_challenge"] },
  { id:"csr-racing-2",   name:"CSR Racing 2",             short:"CSR2",         cat:"racing",         icon:"🏆", g:["#1A237E","#283593"], players:743,  bets:48,  prize:250,  popular:false, verified:false, tags:["Racing","Drag"],       desc:"Drag racing with supercar engines.",     types:["race_winner","head_to_head","tournament_winner"] },
  { id:"sup-racing",     name:"SUP Multiplayer Racing",   short:"SUP Racing",   cat:"racing",         icon:"🚗", g:["#00897B","#00695C"], players:432,  bets:29,  prize:75,   popular:false, verified:false, tags:["Racing","Arcade"],     desc:"Side-scrolling multiplayer racing.",    types:["race_winner","head_to_head","custom_challenge"] },
  { id:"fun-run-3",      name:"Fun Run 3",                short:"Fun Run 3",    cat:"racing",         icon:"🐇", g:["#43A047","#2E7D32"], players:567,  bets:34,  prize:75,   popular:false, verified:false, tags:["Racing","Party"],      desc:"Run and slash your way to the finish.", types:["race_winner","placement","head_to_head"] },
  { id:"kartrider",      name:"KartRider Rush+",          short:"KartRider",    cat:"racing",         icon:"🎮", g:["#E53935","#1565C0"], players:678,  bets:41,  prize:125,  popular:false, verified:false, tags:["Racing","Kart"],       desc:"Nexon's kart racing on mobile.",         types:["race_winner","points_total","head_to_head","tournament_winner"] },
  { id:"beach-buggy",    name:"Beach Buggy Racing 2",     short:"Beach Buggy",  cat:"racing",         icon:"🏖️", g:["#FDD835","#F57C00"], players:345,  bets:18,  prize:50,   popular:false, verified:false, tags:["Racing","Casual"],     desc:"Colourful kart racing with wild power-ups.", types:["race_winner","head_to_head","custom_challenge"] },
  // SPORTS
  { id:"fifa-mobile",    name:"FIFA Mobile",              short:"FIFA Mobile",  cat:"sports",         icon:"⚽", g:["#1565C0","#0D47A1"], players:3456, bets:287, prize:500,  popular:true,  verified:true,  tags:["Football","Soccer"],   desc:"EA's FIFA football on mobile.",          types:["match_winner","score_diff","head_to_head","tournament_winner","custom_challenge"] },
  { id:"efootball",      name:"eFootball",                short:"eFootball",    cat:"sports",         icon:"⚽", g:["#1B5E20","#2E7D32"], players:1234, bets:89,  prize:300,  popular:false, verified:false, tags:["Football","Simulation"], desc:"Konami's free-to-play football.",      types:["match_winner","score_diff","head_to_head","tournament_winner"] },
  { id:"nba-live",       name:"NBA Live Mobile",          short:"NBA Live",     cat:"sports",         icon:"🏀", g:["#E65100","#F57C00"], players:1098, bets:76,  prize:200,  popular:false, verified:false, tags:["Basketball","NBA"],    desc:"EA's official NBA game.",               types:["match_winner","score_diff","mvp","head_to_head"] },
  { id:"golf-battle",    name:"Golf Battle",              short:"Golf Battle",  cat:"sports",         icon:"⛳", g:["#2E7D32","#43A047"], players:876,  bets:67,  prize:100,  popular:true,  verified:false, tags:["Golf","Sports"],       desc:"Multiplayer mini-golf on stunning courses.", types:["match_winner","score_diff","head_to_head","custom_challenge"] },
  { id:"mini-golf-king", name:"Mini Golf King",           short:"Mini Golf",    cat:"sports",         icon:"🏌️", g:["#00897B","#00695C"], players:543,  bets:34,  prize:75,   popular:false, verified:false, tags:["Golf","Casual"],       desc:"Real-time multiplayer mini-golf.",       types:["match_winner","score_diff","head_to_head"] },
  { id:"badminton",      name:"Badminton League",         short:"Badminton",    cat:"sports",         icon:"🏸", g:["#F44336","#E91E63"], players:432,  bets:27,  prize:75,   popular:false, verified:false, tags:["Badminton","Sports"],  desc:"Fast-paced badminton with global multiplayer.", types:["match_winner","score_diff","head_to_head","tournament_winner"] },
  { id:"table-tennis",   name:"Table Tennis Touch",       short:"Table Tennis", cat:"sports",         icon:"🏓", g:["#0097A7","#00838F"], players:312,  bets:19,  prize:50,   popular:false, verified:false, tags:["Table Tennis"],        desc:"Best table tennis game on mobile.",     types:["match_winner","score_diff","head_to_head"] },
  { id:"head-ball-2",    name:"Head Ball 2",              short:"Head Ball 2",  cat:"sports",         icon:"⚽", g:["#1565C0","#0D47A1"], players:678,  bets:45,  prize:100,  popular:false, verified:false, tags:["Football","1v1"],      desc:"1v1 online football with special powers.", types:["match_winner","score_diff","head_to_head","custom_challenge"] },
  { id:"ultimate-tennis", name:"Ultimate Tennis",         short:"Tennis",       cat:"sports",         icon:"🎾", g:["#FDD835","#F9A825"], players:456,  bets:31,  prize:100,  popular:false, verified:false, tags:["Tennis","Sports"],     desc:"Real-time online tennis with 40+ pros.", types:["match_winner","score_diff","head_to_head","tournament_winner"] },
  { id:"cricket-league", name:"Cricket League",           short:"Cricket",      cat:"sports",         icon:"🏏", g:["#1B5E20","#2E7D32"], players:1543, bets:112, prize:200,  popular:true,  verified:false, tags:["Cricket","Sports"],    desc:"Real-time 1v1 cricket matches.",         types:["match_winner","score_diff","head_to_head","custom_challenge"] },
  // BATTLE & ACTION
  { id:"shadow-fight",   name:"Shadow Fight Arena",       short:"Shadow Fight", cat:"battle_action",  icon:"🥷", g:["#212121","#424242"], players:987,  bets:76,  prize:200,  popular:false, verified:false, tags:["Fighting","PvP"],      desc:"Silhouette-style martial arts PvP.",    types:["match_winner","kill_count","head_to_head","tournament_winner"] },
  { id:"zooba",          name:"Zooba",                    short:"Zooba",        cat:"battle_action",  icon:"🦁", g:["#2E7D32","#43A047"], players:654,  bets:42,  prize:100,  popular:false, verified:false, tags:["Battle Royale","Casual"], desc:"Zoo-themed Battle Royale.",            types:["match_winner","kill_count","placement","custom_challenge"] },
  { id:"t3-arena",       name:"T3 Arena",                 short:"T3 Arena",     cat:"battle_action",  icon:"🤖", g:["#0033CC","#1565C0"], players:543,  bets:34,  prize:150,  popular:false, verified:false, tags:["Shooter","3v3"],       desc:"Fast-paced 3v3 hero shooter.",          types:["match_winner","kill_count","mvp","head_to_head"] },
  { id:"critical-ops",   name:"Critical Ops",             short:"C-OPS",        cat:"battle_action",  icon:"🎯", g:["#1A237E","#283593"], players:1234, bets:98,  prize:400,  popular:true,  verified:true,  tags:["FPS","Competitive"],   desc:"Counter-Strike inspired competitive FPS.", types:["match_winner","kill_count","mvp","tournament_winner","custom_challenge"] },
  { id:"modern-combat",  name:"Modern Combat 5",          short:"MC5",          cat:"battle_action",  icon:"💣", g:["#B71C1C","#C62828"], players:765,  bets:51,  prize:200,  popular:false, verified:false, tags:["FPS","Action"],        desc:"Console-quality mobile FPS.",           types:["match_winner","kill_count","head_to_head"] },
  { id:"war-robots",     name:"War Robots",               short:"War Robots",   cat:"battle_action",  icon:"🤖", g:["#37474F","#546E7A"], players:876,  bets:59,  prize:200,  popular:false, verified:false, tags:["Robots","6v6"],        desc:"6v6 multiplayer mech battles.",          types:["match_winner","kill_count","mvp","head_to_head"] },
  { id:"bullet-echo",    name:"Bullet Echo",              short:"Bullet Echo",  cat:"battle_action",  icon:"💫", g:["#1A237E","#311B92"], players:456,  bets:29,  prize:100,  popular:false, verified:false, tags:["Battle Royale","Stealth"], desc:"Top-down stealth Battle Royale.",      types:["match_winner","placement","kill_count","custom_challenge"] },
  { id:"identity-v",     name:"Identity V",               short:"Identity V",   cat:"battle_action",  icon:"🎪", g:["#4A148C","#6A1B9A"], players:678,  bets:43,  prize:150,  popular:false, verified:false, tags:["Horror","Asymmetric"], desc:"4 survivors vs 1 hunter horror game.",  types:["match_winner","custom_challenge","head_to_head"] },
  { id:"arena-of-valor", name:"Arena of Valor",           short:"AoV",          cat:"battle_action",  icon:"⚔️", g:["#7B1FA2","#9C27B0"], players:1543, bets:109, prize:500,  popular:true,  verified:true,  tags:["MOBA","5v5"],          desc:"Tencent's MOBA with 100+ heroes.",      types:["match_winner","mvp","kill_count","tournament_winner","custom_challenge"] },
  { id:"dragon-ball",    name:"Dragon Ball Legends",      short:"DB Legends",   cat:"battle_action",  icon:"🐉", g:["#F57F17","#F9A825"], players:987,  bets:67,  prize:200,  popular:false, verified:false, tags:["Anime","PvP","Cards"],  desc:"Real-time PvP Dragon Ball card-action.", types:["match_winner","tournament_winner","head_to_head"] },
  // SURVIVAL & SANDBOX
  { id:"minecraft",      name:"Minecraft",                short:"Minecraft",    cat:"survival",       icon:"⛏️", g:["#5D4037","#795548"], players:4321, bets:234, prize:300,  popular:true,  verified:true,  tags:["Sandbox","Survival"],  desc:"Build, survive, and explore infinite worlds.", types:["custom_challenge","head_to_head"] },
  { id:"terraria",       name:"Terraria",                 short:"Terraria",     cat:"survival",       icon:"⚒️", g:["#2E7D32","#43A047"], players:876,  bets:56,  prize:150,  popular:false, verified:false, tags:["Sandbox","Adventure"], desc:"2D sandbox adventure.",                  types:["custom_challenge","head_to_head","tournament_winner"] },
  { id:"ark-mobile",     name:"ARK: Survival Evolved",    short:"ARK Mobile",   cat:"survival",       icon:"🦕", g:["#33691E","#558B2F"], players:543,  bets:31,  prize:100,  popular:false, verified:false, tags:["Survival","Dinosaurs"], desc:"Survive among dinosaurs.",              types:["custom_challenge","head_to_head"] },
  { id:"roblox",         name:"Roblox",                   short:"Roblox",       cat:"survival",       icon:"🧱", g:["#CC0000","#E53935"], players:7654, bets:432, prize:500,  popular:true,  verified:true,  tags:["Platform","Creative"], desc:"Gaming platform with millions of games.", types:["match_winner","custom_challenge","tournament_winner"] },
  { id:"last-day",       name:"Last Day on Earth",        short:"LDOE",         cat:"survival",       icon:"🧟", g:["#5D4037","#795548"], players:432,  bets:24,  prize:75,   popular:false, verified:false, tags:["Survival","Zombie"],   desc:"Post-apocalyptic survival game.",        types:["custom_challenge","head_to_head"] },
  { id:"frostborn",      name:"Frostborn",                short:"Frostborn",    cat:"survival",       icon:"❄️", g:["#0288D1","#01579B"], players:312,  bets:19,  prize:50,   popular:false, verified:false, tags:["Viking","Survival"],   desc:"Viking-themed co-op survival RPG.",     types:["custom_challenge","head_to_head"] },
  { id:"mini-world",     name:"Mini World: Block Art",    short:"Mini World",   cat:"survival",       icon:"🌍", g:["#00897B","#00695C"], players:234,  bets:12,  prize:40,   popular:false, verified:false, tags:["Sandbox","Building"],  desc:"Minecraft-inspired sandbox.",            types:["custom_challenge","head_to_head"] },
  { id:"survivalists",   name:"The Survivalists",         short:"Survivalists", cat:"survival",       icon:"🏝️", g:["#F9A825","#F57F17"], players:198,  bets:9,   prize:30,   popular:false, verified:false, tags:["Survival","Co-op"],    desc:"Island survival with monkey companions.", types:["custom_challenge"] },
  { id:"portal-knights", name:"Portal Knights",           short:"Portal Knights", cat:"survival",     icon:"🌈", g:["#7B1FA2","#9C27B0"], players:287,  bets:14,  prize:50,   popular:false, verified:false, tags:["RPG","Sandbox"],       desc:"Action RPG meets sandbox.",              types:["custom_challenge","head_to_head"] },
  { id:"dont-starve",    name:"Don't Starve: Together",   short:"Don't Starve", cat:"survival",       icon:"🕯️", g:["#212121","#424242"], players:456,  bets:27,  prize:75,   popular:false, verified:false, tags:["Survival","Co-op"],    desc:"Gothic survival — survive or starve together.", types:["custom_challenge","head_to_head"] },
  // PUZZLE & BRAIN
  { id:"words-friends",  name:"Words With Friends 2",     short:"WWF2",         cat:"puzzle_brain",   icon:"🔡", g:["#1565C0","#0D47A1"], players:1234, bets:87,  prize:100,  popular:true,  verified:false, tags:["Word Game","Puzzle"],  desc:"Scrabble-like word game with friends.",  types:["match_winner","points_total","head_to_head"] },
  { id:"trivia-crack",   name:"Trivia Crack",             short:"Trivia Crack", cat:"puzzle_brain",   icon:"💡", g:["#F44336","#FF9800"], players:876,  bets:63,  prize:100,  popular:false, verified:false, tags:["Trivia","Quiz"],       desc:"Spin the wheel and answer trivia.",      types:["match_winner","points_total","head_to_head","tournament_winner"] },
  { id:"quizup",         name:"QuizUp",                   short:"QuizUp",       cat:"puzzle_brain",   icon:"❓", g:["#0288D1","#01579B"], players:543,  bets:31,  prize:75,   popular:false, verified:false, tags:["Quiz","Trivia"],       desc:"Real-time trivia battles.",              types:["match_winner","points_total","head_to_head"] },
  { id:"ruzzle",         name:"Ruzzle",                   short:"Ruzzle",       cat:"puzzle_brain",   icon:"🔤", g:["#F9A825","#F57F17"], players:312,  bets:18,  prize:50,   popular:false, verified:false, tags:["Word","Puzzle"],       desc:"Fast-paced word puzzle game.",           types:["match_winner","points_total","head_to_head"] },
  { id:"songpop-2",      name:"SongPop 2",                short:"SongPop 2",    cat:"puzzle_brain",   icon:"🎵", g:["#E91E63","#F06292"], players:456,  bets:29,  prize:50,   popular:false, verified:false, tags:["Music","Trivia"],      desc:"Name that tune faster than your opponent.", types:["match_winner","head_to_head","custom_challenge"] },
  { id:"stop-game",      name:"Stop! Categories Game",    short:"Stop!",        cat:"puzzle_brain",   icon:"✋", g:["#CC0000","#B71C1C"], players:234,  bets:14,  prize:30,   popular:false, verified:false, tags:["Word","Party"],        desc:"Name things in categories fast.",        types:["match_winner","points_total","head_to_head"] },
  { id:"word-blitz",     name:"Word Blitz",               short:"Word Blitz",   cat:"puzzle_brain",   icon:"⚡", g:["#0033CC","#1565C0"], players:198,  bets:11,  prize:30,   popular:false, verified:false, tags:["Word","Fast-paced"],   desc:"Competitive word scramble real-time.",   types:["match_winner","points_total","head_to_head"] },
  { id:"brain-wars",     name:"Brain Wars",               short:"Brain Wars",   cat:"puzzle_brain",   icon:"🧠", g:["#7B1FA2","#9C27B0"], players:287,  bets:16,  prize:50,   popular:false, verified:false, tags:["Brain","Puzzle"],      desc:"Real-time brain training battles.",      types:["match_winner","points_total","head_to_head"] },
  { id:"elevate",        name:"Elevate Challenges",       short:"Elevate",      cat:"puzzle_brain",   icon:"📈", g:["#00897B","#00695C"], players:312,  bets:19,  prize:50,   popular:false, verified:false, tags:["Brain","Education"],   desc:"Brain training with competitive challenges.", types:["match_winner","points_total","head_to_head"] },
  { id:"guess-answer",   name:"Guess Their Answer",       short:"Guess Answer", cat:"puzzle_brain",   icon:"🤔", g:["#F57C00","#EF6C00"], players:543,  bets:34,  prize:50,   popular:false, verified:false, tags:["Party","Trivia"],      desc:"Guess the most popular answers.",        types:["match_winner","points_total","custom_challenge"] },
  // RPG & STRATEGY
  { id:"genshin-impact", name:"Genshin Impact",           short:"Genshin",      cat:"other",          icon:"🌸", g:["#0D47A1","#5C6BC0"], players:3456, bets:198, prize:500,  popular:true,  verified:true,  tags:["RPG","Open World"],    desc:"Open-world action RPG with co-op.",      types:["custom_challenge","tournament_winner","head_to_head"] },
  { id:"diablo-immortal", name:"Diablo Immortal",         short:"Diablo",       cat:"other",          icon:"😈", g:["#B71C1C","#880E4F"], players:1234, bets:78,  prize:300,  popular:false, verified:false, tags:["RPG","Dungeon"],       desc:"Dungeon crawling action RPG.",           types:["match_winner","custom_challenge","tournament_winner"] },
  { id:"sky",            name:"Sky: Children of the Light", short:"Sky",        cat:"other",          icon:"🌅", g:["#FDD835","#F9A825"], players:876,  bets:34,  prize:100,  popular:false, verified:false, tags:["Social","Adventure"],  desc:"Beautiful social adventure game.",       types:["custom_challenge"] },
  { id:"albion-online",  name:"Albion Online",            short:"Albion",       cat:"other",          icon:"🏰", g:["#5D4037","#795548"], players:654,  bets:43,  prize:400,  popular:false, verified:false, tags:["MMORPG","PvP"],        desc:"Sandbox MMORPG with full loot PvP.",    types:["match_winner","tournament_winner","custom_challenge"] },
  { id:"osrs",           name:"Old School RuneScape",     short:"OSRS",         cat:"other",          icon:"⚔️", g:["#795548","#5D4037"], players:1876, bets:123, prize:500,  popular:true,  verified:true,  tags:["MMORPG","Classic"],    desc:"The iconic 2007 RuneScape on mobile.",   types:["custom_challenge","head_to_head","tournament_winner"] },
  { id:"pokemon-unite",  name:"Pokémon Unite",            short:"Pokémon Unite", cat:"other",         icon:"⚡", g:["#FDD835","#1565C0"], players:2134, bets:145, prize:300,  popular:true,  verified:false, tags:["MOBA","Pokémon"],      desc:"5v5 Pokémon MOBA.",                      types:["match_winner","mvp","tournament_winner","custom_challenge"] },
  { id:"hearthstone",    name:"Hearthstone",              short:"Hearthstone",  cat:"other",          icon:"🃏", g:["#E65100","#BF360C"], players:1543, bets:112, prize:400,  popular:true,  verified:true,  tags:["Card Game","Strategy"], desc:"Blizzard's legendary digital card game.", types:["match_winner","tournament_winner","head_to_head","custom_challenge"] },
  { id:"legends-runeterra", name:"Legends of Runeterra",  short:"LoR",         cat:"other",          icon:"🌙", g:["#0D47A1","#1A237E"], players:876,  bets:67,  prize:250,  popular:false, verified:false, tags:["Card Game","LoL"],     desc:"Riot's strategic card game.",            types:["match_winner","tournament_winner","head_to_head"] },
  { id:"marvel-snap",    name:"Marvel Snap",              short:"Marvel Snap",  cat:"other",          icon:"💥", g:["#C62828","#1565C0"], players:1234, bets:89,  prize:300,  popular:true,  verified:false, tags:["Card Game","Marvel"],  desc:"Ultra-fast 6-turn card game.",           types:["match_winner","tournament_winner","head_to_head","custom_challenge"] },
  { id:"yugioh",         name:"Yu-Gi-Oh! Duel Links",     short:"Duel Links",   cat:"other",          icon:"🐉", g:["#7B1FA2","#4A148C"], players:987,  bets:76,  prize:300,  popular:false, verified:false, tags:["Card Game","Anime"],   desc:"The iconic trading card game on mobile.", types:["match_winner","tournament_winner","head_to_head","custom_challenge"] },
  { id:"state-survival", name:"State of Survival",        short:"SoS",          cat:"other",          icon:"🧟", g:["#37474F","#546E7A"], players:543,  bets:31,  prize:100,  popular:false, verified:false, tags:["Strategy","Zombie"],   desc:"Post-apocalyptic strategy game.",        types:["custom_challenge","tournament_winner"] },
  { id:"rise-kingdoms",  name:"Rise of Kingdoms",         short:"RoK",          cat:"other",          icon:"🏛️", g:["#5D4037","#8D6E63"], players:876,  bets:54,  prize:200,  popular:false, verified:false, tags:["Strategy","RTS"],      desc:"Real-time civilization strategy.",       types:["match_winner","custom_challenge","tournament_winner"] },
  { id:"lords-mobile",   name:"Lords Mobile",             short:"Lords Mobile", cat:"other",          icon:"⚔️", g:["#1A237E","#283593"], players:765,  bets:45,  prize:150,  popular:false, verified:false, tags:["Strategy","Kingdom"],  desc:"Build your kingdom and lead armies.",    types:["match_winner","tournament_winner","custom_challenge"] },
  { id:"top-war",        name:"Top War: Battle Game",     short:"Top War",      cat:"other",          icon:"🚀", g:["#0D47A1","#01579B"], players:432,  bets:23,  prize:75,   popular:false, verified:false, tags:["Strategy","Merge"],    desc:"Merge and upgrade military forces.",     types:["custom_challenge","tournament_winner"] },
  { id:"township",       name:"Township",                 short:"Township",     cat:"other",          icon:"🌾", g:["#558B2F","#33691E"], players:1234, bets:45,  prize:50,   popular:false, verified:false, tags:["Casual","Building"],   desc:"Build and manage your own town.",        types:["custom_challenge"] },
  { id:"hay-day",        name:"Hay Day",                  short:"Hay Day",      cat:"other",          icon:"🌻", g:["#F9A825","#F57F17"], players:987,  bets:34,  prize:50,   popular:false, verified:false, tags:["Farming","Casual"],    desc:"Supercell's popular farming game.",      types:["custom_challenge"] },
  { id:"simcity",        name:"SimCity BuildIt",          short:"SimCity",      cat:"other",          icon:"🏙️", g:["#0288D1","#0097A7"], players:654,  bets:29,  prize:75,   popular:false, verified:false, tags:["City Building"],       desc:"Build the city of your dreams.",         types:["custom_challenge","tournament_winner"] },
  { id:"battle-cats",    name:"The Battle Cats",          short:"Battle Cats",  cat:"other",          icon:"🐱", g:["#F57C00","#EF6C00"], players:432,  bets:21,  prize:50,   popular:false, verified:false, tags:["Tower Defence","Cats"], desc:"Deploy armies of bizarre cats.",         types:["custom_challenge","tournament_winner"] },
  { id:"idle-heroes",    name:"Idle Heroes",              short:"Idle Heroes",  cat:"other",          icon:"⚔️", g:["#4A148C","#6A1B9A"], players:765,  bets:47,  prize:150,  popular:false, verified:false, tags:["Idle RPG","Heroes"],   desc:"Collect heroes to auto-battle.",         types:["custom_challenge","tournament_winner","head_to_head"] },
  { id:"afk-arena",      name:"AFK Arena",                short:"AFK Arena",    cat:"other",          icon:"🏆", g:["#1B5E20","#2E7D32"], players:1087, bets:78,  prize:200,  popular:false, verified:false, tags:["Idle RPG","Fantasy"],  desc:"Idle RPG — collect heroes and battle.",  types:["tournament_winner","custom_challenge","head_to_head"] },
];

const COMMISSION = 0.10;
const totalPlayers = GAMES.reduce((s,g)=>s+g.players,0);
const totalBets    = GAMES.reduce((s,g)=>s+g.bets,0);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function GamingHub() {
  const [view, setView]             = useState("hub");      // "hub" | "detail"
  const [selectedGame, setGame]     = useState(null);
  const [search, setSearch]         = useState("");
  const [category, setCat]          = useState("all");
  const [sortBy, setSort]           = useState("popular");
  const [betTypeFilter, setBTF]     = useState("all");
  const [betModal, setBetModal]     = useState(false);
  const [challengeModal, setChaMod] = useState(false);
  const [activeTab, setActiveTab]   = useState("Bets");
  const [betForm, setBetForm]       = useState({ betType:"match_winner", desc:"", selection:"", stake:"", odds:"2.00", visibility:"public" });
  const [chalForm, setChalForm]     = useState({ target:"", desc:"", stake:"", odds:"2.00" });
  const [step, setStep]             = useState(1);
  const [mockBets, setMockBets]     = useState([]);
  const [notification, setNotif]    = useState(null);

  const showNotif = useCallback((msg, type="success") => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3500);
  }, []);

  const filtered = useMemo(() => {
    let list = search
      ? GAMES.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || g.short.toLowerCase().includes(search.toLowerCase()) || g.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
      : [...GAMES];
    if (category !== "all") list = list.filter(g => g.cat === category);
    if (sortBy === "popular") list.sort((a,b) => b.players - a.players);
    else if (sortBy === "bets") list.sort((a,b) => b.bets - a.bets);
    else if (sortBy === "prize") list.sort((a,b) => b.prize - a.prize);
    else list.sort((a,b) => a.name.localeCompare(b.name));
    return list;
  }, [search, category, sortBy]);

  const openGame = (game) => {
    setGame(game);
    setView("detail");
    setActiveTab("Bets");
    setBTF("all");
    setMockBets(getMockBets(game));
    window.scrollTo(0,0);
  };

  const placeBet = () => {
    const { desc, stake, odds } = betForm;
    if (!desc || !stake || !odds) return;
    const s = parseFloat(stake), o = parseFloat(odds);
    const newBet = {
      id: Date.now(), game: selectedGame, betType: betForm.betType,
      desc, stake: s, odds: o, net: s*o*0.9, status:"open",
      creator:"you", created: new Date()
    };
    setMockBets(prev => [newBet, ...prev]);
    setBetModal(false);
    setBetForm({ betType:"match_winner", desc:"", selection:"", stake:"", odds:"2.00", visibility:"public" });
    setStep(1);
    showNotif(`🎮 Bet live on ${selectedGame.short}! Stake $${s.toFixed(2)} in escrow.`);
  };

  const sendChallenge = () => {
    const { target, desc, stake, odds } = chalForm;
    if (!target || !desc || !stake) return;
    setChaMod(false);
    setChalForm({ target:"", desc:"", stake:"", odds:"2.00" });
    showNotif(`⚔️ Challenge sent to @${target}!`);
  };

  const sx = { ...styles };

  return (
    <div style={sx.root}>
      {/* ── Notification Toast ──────────────────────────────────────── */}
      {notification && (
        <div style={{ ...sx.toast, background: notification.type === "error" ? "#CC0000" : "#00C853" }}>
          {notification.msg}
        </div>
      )}

      {view === "hub" ? (
        <HubView
          filtered={filtered} category={category} search={search} sortBy={sortBy}
          setCat={setCat} setSearch={setSearch} setSort={setSort}
          onGameClick={openGame}
        />
      ) : selectedGame ? (
        <DetailView
          game={selectedGame}
          bets={betTypeFilter === "all" ? mockBets : mockBets.filter(b => b.betType === betTypeFilter)}
          betTypeFilter={betTypeFilter} setBTF={setBTF}
          activeTab={activeTab} setActiveTab={setActiveTab}
          onBack={() => { setView("hub"); setGame(null); }}
          onBet={() => { setBetModal(true); setStep(1); }}
          onChallenge={() => setChaMod(true)}
        />
      ) : null}

      {/* ── Create Bet Modal ─────────────────────────────────────────── */}
      {betModal && selectedGame && (
        <Modal title={`🎮 Bet on ${selectedGame.short}`} onClose={() => { setBetModal(false); setStep(1); }}>
          <GameBetForm
            game={selectedGame} form={betForm} setForm={setBetForm}
            step={step} setStep={setStep}
            onSubmit={placeBet} onCancel={() => { setBetModal(false); setStep(1); }}
          />
        </Modal>
      )}

      {/* ── Challenge Modal ───────────────────────────────────────────── */}
      {challengeModal && selectedGame && (
        <Modal title={`⚔️ Challenge Player — ${selectedGame.short}`} onClose={() => setChaMod(false)}>
          <ChallengeForm
            game={selectedGame} form={chalForm} setForm={setChalForm}
            onSubmit={sendChallenge} onCancel={() => setChaMod(false)}
          />
        </Modal>
      )}
    </div>
  );
}

// ─── HUB VIEW ────────────────────────────────────────────────────────────────
function HubView({ filtered, category, search, sortBy, setCat, setSearch, setSort, onGameClick }) {
  const popular = GAMES.filter(g => g.popular);

  return (
    <div>
      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroOverlay} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={styles.heroTitle}>
            <span style={{ color:"#CC0000" }}>GAME</span>
            <span style={{ color:"rgba(255,255,255,0.2)", margin:"0 10px" }}>×</span>
            <span style={{ color:"#5580FF" }}>BET</span>
          </div>
          <p style={styles.heroSub}>Challenge anyone across 100 games. Bet real money on who wins. 10% platform commission.</p>
          <div style={styles.statRow}>
            {[
              { icon:"🎮", v: GAMES.length,              l:"Games" },
              { icon:"👥", v: totalPlayers.toLocaleString(), l:"Players" },
              { icon:"🎯", v: totalBets.toLocaleString(), l:"Open Bets" },
              { icon:"🏆", v:"$1,000",                   l:"Top Prize" },
            ].map(s => (
              <div key={s.l} style={styles.statBox}>
                <div style={{ fontSize:20 }}>{s.icon}</div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, lineHeight:1 }}>{s.v}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginTop:2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:"16px" }}>
        {/* Search */}
        <div style={{ position:"relative", marginBottom:14 }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#555", fontSize:16 }}>🔍</span>
          <input style={{ ...styles.input, paddingLeft:38, height:46, fontSize:15 }}
            placeholder="Search 100 games — PUBG, Chess, Roblox, FIFA…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:18 }}>×</button>}
        </div>

        {/* Category filter */}
        <div style={{ overflowX:"auto", display:"flex", gap:6, paddingBottom:10, scrollbarWidth:"none" }}>
          <CategoryPill active={category==="all"} color="#CC0000" onClick={() => setCat("all")}>🎮 All ({GAMES.length})</CategoryPill>
          {Object.entries(CATEGORIES).map(([k,c]) => (
            <CategoryPill key={k} active={category===k} color={c.color} onClick={() => setCat(k)}>
              {c.icon} {c.label} ({GAMES.filter(g=>g.cat===k).length})
            </CategoryPill>
          ))}
        </div>

        {/* Sort + count */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontSize:12, color:"#666" }}>{filtered.length} game{filtered.length!==1?"s":""} found</div>
          <select style={{ ...styles.input, width:"auto", height:32, fontSize:12, padding:"4px 10px" }} value={sortBy} onChange={e => setSort(e.target.value)}>
            <option value="popular">Most Popular</option>
            <option value="bets">Most Bets</option>
            <option value="prize">Biggest Prize</option>
            <option value="az">A–Z</option>
          </select>
        </div>

        {/* Hot games horizontal scroll */}
        {!search && category === "all" && (
          <div style={{ marginBottom:24 }}>
            <SectionTitle icon="🔥" title="HOT RIGHT NOW" />
            <div style={{ overflowX:"auto", display:"flex", gap:10, scrollbarWidth:"none", paddingBottom:4 }}>
              {popular.map(game => <HotCard key={game.id} game={game} onClick={() => onGameClick(game)} />)}
            </div>
          </div>
        )}

        {/* Category sections or filtered grid */}
        {!search && category === "all" ? (
          Object.entries(CATEGORIES).map(([k,c]) => {
            const games = GAMES.filter(g=>g.cat===k);
            return (
              <div key={k} style={{ marginBottom:28 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:22 }}>{c.icon}</span>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:"#F0F0F0" }}>{c.label.toUpperCase()}</span>
                    <span style={{ fontSize:11, color:"#666", background:"#1E1E1E", padding:"2px 8px", borderRadius:20 }}>{games.length}</span>
                  </div>
                  <button onClick={() => setCat(k)} style={{ background:"none", border:"none", color:"#5580FF", fontSize:12, cursor:"pointer", fontWeight:700 }}>View all →</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:10 }}>
                  {games.slice(0,4).map(g => <GameCard key={g.id} game={g} onClick={() => onGameClick(g)} />)}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:10 }}>
            {filtered.map(g => <GameCard key={g.id} game={g} onClick={() => onGameClick(g)} />)}
            {filtered.length === 0 && (
              <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"60px 0", color:"#555" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🎮</div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20 }}>No games found</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DETAIL VIEW ─────────────────────────────────────────────────────────────
function DetailView({ game, bets, betTypeFilter, setBTF, activeTab, setActiveTab, onBack, onBet, onChallenge }) {
  const TABS = ["Bets","Leaderboard","How to Bet","Community"];
  const lb = getMockLB(game.id);
  const posts = getMockPosts(game);

  return (
    <div>
      {/* Game hero */}
      <div style={{ background:`linear-gradient(160deg,${game.g[0]}ee,${game.g[1]}ee)`, padding:"20px 16px 0", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:-10, top:-10, fontSize:200, opacity:0.05, lineHeight:1, userSelect:"none" }}>{game.icon}</div>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <button onClick={onBack} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:8, padding:"6px 12px", cursor:"pointer", color:"white", fontWeight:700, fontSize:13 }}>← Back</button>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, color:"white", lineHeight:1 }}>
                {game.name} {game.verified && "✅"}
              </div>
              <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" }}>
                {game.tags.map(t => <span key={t} style={{ fontSize:10, color:"rgba(255,255,255,0.6)", background:"rgba(255,255,255,0.12)", padding:"2px 7px", borderRadius:20 }}>{t}</span>)}
                {game.popular && <span style={{ fontSize:10, color:"white", background:"#CC0000", padding:"2px 7px", borderRadius:20, fontWeight:700 }}>🔥 HOT</span>}
              </div>
            </div>
            <div style={{ fontSize:42 }}>{game.icon}</div>
          </div>

          <p style={{ fontSize:13, color:"rgba(255,255,255,0.8)", lineHeight:1.5, marginBottom:14 }}>{game.desc}</p>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 }}>
            {[{icon:"👥",v:game.players.toLocaleString(),l:"Players"},{icon:"🎯",v:game.bets,l:"Open Bets"},{icon:"🏆",v:`$${game.prize}`,l:"Top Prize"}].map(s=>(
              <div key={s.l} style={{ background:"rgba(0,0,0,0.25)", borderRadius:8, padding:"10px", textAlign:"center" }}>
                <div style={{ fontSize:16 }}>{s.icon}</div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:"white", lineHeight:1 }}>{s.v}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)", marginTop:2 }}>{s.l}</div>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", gap:8, paddingBottom:16 }}>
            <button onClick={onBet} style={{ flex:2, padding:"12px", background:"white", border:"none", borderRadius:10, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, cursor:"pointer", color:"#0D0D0D" }}>
              🎯 CREATE BET
            </button>
            <button onClick={onChallenge} style={{ flex:1, padding:"12px", background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer", color:"white" }}>
              ⚔️ Challenge
            </button>
          </div>
        </div>
      </div>

      {/* Bet type pills */}
      <div style={{ background:"#161616", borderBottom:"1px solid #2A2A2A", padding:"10px 16px", overflowX:"auto", display:"flex", gap:6, scrollbarWidth:"none" }}>
        <BetTypePill active={betTypeFilter==="all"} color={game.g[0]} onClick={()=>setBTF("all")}>All</BetTypePill>
        {game.types.map(bt => (
          <BetTypePill key={bt} active={betTypeFilter===bt} color={game.g[0]} onClick={()=>setBTF(bt)}>
            {BET_TYPES[bt] || bt.replace(/_/g," ")}
          </BetTypePill>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:"1px solid #2A2A2A", padding:"0 16px", background:"#0D0D0D", position:"sticky", top:0, zIndex:10 }}>
        {TABS.map(t => (
          <button key={t} onClick={()=>setActiveTab(t)} style={{
            padding:"12px 14px", border:"none", background:"none", cursor:"pointer",
            fontWeight:700, fontSize:12, textTransform:"uppercase", letterSpacing:"0.04em",
            color: activeTab===t ? game.g[0] : "#555",
            borderBottom: activeTab===t ? `2px solid ${game.g[0]}` : "2px solid transparent"
          }}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding:"14px 16px" }}>
        {activeTab === "Bets" && (
          <div>
            <div style={{ background:`${game.g[0]}15`, border:`1px solid ${game.g[0]}30`, borderRadius:8, padding:"9px 12px", marginBottom:12, fontSize:12, color:"#aaa", display:"flex", gap:6, alignItems:"center" }}>
              ⚡ All payouts carry a <strong style={{ color:"#F0F0F0" }}>10% commission</strong> deducted from winnings at settlement.
            </div>
            {bets.length > 0
              ? bets.map(bet => <BetListCard key={bet.id} bet={bet} game={game} />)
              : <EmptyBets game={game} onBet={onBet} />
            }
          </div>
        )}

        {activeTab === "Leaderboard" && (
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, marginBottom:14 }}>🏆 TOP {game.short.toUpperCase()} BETTORS</div>
            {lb.map((p,i) => (
              <div key={p.u} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px", background:"#161616", borderRadius:10, marginBottom:8, border:`1px solid ${i===0?"rgba(255,215,0,0.3)":"#2A2A2A"}` }}>
                <div style={{ width:32, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, textAlign:"center", color:i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":"#555" }}>
                  {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
                </div>
                <div style={{ width:40, height:40, borderRadius:"50%", flexShrink:0, background:`linear-gradient(135deg,${game.g[0]},${game.g[1]})`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:900, fontSize:16 }}>
                  {p.u[0].toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700 }}>@{p.u}</div>
                  <div style={{ fontSize:11, color:"#666" }}>{p.wins} wins · {p.rate}% rate</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:"#00C853" }}>+${p.profit.toLocaleString()}</div>
                  <div style={{ fontSize:10, color:"#555" }}>NET WON</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "How to Bet" && (
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, marginBottom:16 }}>📖 HOW TO BET ON {game.short.toUpperCase()}</div>
            {[
              { n:"1", t:"Choose a bet type", d:`${game.short} supports ${game.types.length} bet types: ${game.types.slice(0,3).map(b=>BET_TYPES[b]||b.replace(/_/g," ")).join(", ")}${game.types.length>3?" & more":""}.` },
              { n:"2", t:"Set your stake & odds", d:`Choose stake ($1–$10,000) and agree on odds with your opponent. Fair ${game.short} odds are typically 1.5–2.5x.` },
              { n:"3", t:"Create or accept", d:`Post publicly for anyone to accept, or directly challenge a specific player. Stake goes into escrow immediately.` },
              { n:"4", t:"Play the game", d:`Both players play ${game.short}. Report results honestly — disputes can be raised within 24 hours.` },
              { n:"5", t:"Get paid", d:`Winner receives payout minus 10% commission. Net winnings go straight to your 50/50 Life wallet.` },
            ].map(s => (
              <div key={s.n} style={{ display:"flex", gap:14, marginBottom:16 }}>
                <div style={{ width:34, height:34, borderRadius:"50%", flexShrink:0, background:`linear-gradient(135deg,${game.g[0]},${game.g[1]})`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18 }}>{s.n}</div>
                <div><div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>{s.t}</div><div style={{ fontSize:12, color:"#888", lineHeight:1.5 }}>{s.d}</div></div>
              </div>
            ))}
            <div style={{ background:"#161616", border:"1px solid #2A2A2A", borderRadius:10, padding:14, marginTop:8 }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:15, marginBottom:10, color:`${game.g[0]}` }}>⚡ SUPPORTED BET TYPES</div>
              {game.types.map(bt => (
                <div key={bt} style={{ display:"flex", gap:10, marginBottom:8, alignItems:"flex-start" }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", flexShrink:0, marginTop:5, background:`linear-gradient(135deg,${game.g[0]},${game.g[1]})` }} />
                  <div><div style={{ fontWeight:700, fontSize:13 }}>{BET_TYPES[bt]||bt.replace(/_/g," ")}</div></div>
                </div>
              ))}
            </div>
            <div style={{ background:"rgba(245,124,0,0.08)", border:"1px solid rgba(245,124,0,0.25)", borderRadius:8, padding:"10px 12px", marginTop:12, fontSize:12, color:"#aaa" }}>
              💰 <strong style={{ color:"#F0F0F0" }}>Commission:</strong> 10% of all winning payouts go to the platform. Shown clearly on every bet before you accept.
            </div>
          </div>
        )}

        {activeTab === "Community" && (
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, marginBottom:14 }}>💬 {game.short.toUpperCase()} COMMUNITY</div>
            {posts.map(p => (
              <div key={p.id} style={{ background:"#161616", border:"1px solid #2A2A2A", borderRadius:10, padding:14, marginBottom:10 }}>
                <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0, background:`linear-gradient(135deg,${game.g[0]},${game.g[1]})`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:900, fontSize:13 }}>{p.u[0].toUpperCase()}</div>
                  <div><div style={{ fontWeight:700, fontSize:13 }}>@{p.u}</div><div style={{ fontSize:11, color:"#555" }}>{p.t}</div></div>
                </div>
                <p style={{ fontSize:13, lineHeight:1.5, marginBottom:8, color:"#DDD" }}>{p.c}</p>
                <div style={{ display:"flex", gap:12, fontSize:12, color:"#555" }}>
                  <span>❤️ {p.l}</span><span>💬 {p.r}</span>
                  {p.bet && <span style={{ color:"#F57C00", fontWeight:700 }}>🎯 Includes bet</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BET FORM ─────────────────────────────────────────────────────────────────
function GameBetForm({ game, form, setForm, step, setStep, onSubmit, onCancel }) {
  const s = parseFloat(form.stake)||0, o = parseFloat(form.odds)||0;
  const gross = s*o, comm = gross*COMMISSION, net = gross-comm;
  const ok = form.desc && s >= 1 && o >= 1.01;

  const sf = (k,v) => setForm(p=>({...p,[k]:v}));

  return step === 1 ? (
    <div>
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:18, padding:12, background:`${game.g[0]}18`, borderRadius:10, border:`1px solid ${game.g[0]}30` }}>
        <div style={{ width:44, height:44, borderRadius:10, background:`linear-gradient(135deg,${game.g[0]},${game.g[1]})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>{game.icon}</div>
        <div><div style={{ fontWeight:900, fontSize:15 }}>{game.name}</div><div style={{ fontSize:11, color:"#888" }}>{game.bets} open bets · {game.players.toLocaleString()} players</div></div>
      </div>

      <label style={styles.label}>Bet Type</label>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:14 }}>
        {game.types.map(bt => (
          <button key={bt} onClick={()=>sf("betType",bt)} style={{
            padding:"8px 10px", borderRadius:8, cursor:"pointer", textAlign:"left",
            background: form.betType===bt ? `${game.g[0]}20` : "#1A1A1A",
            border:`2px solid ${form.betType===bt ? game.g[0] : "#2A2A2A"}`,
            transition:"all 0.15s"
          }}>
            <div style={{ fontWeight:700, fontSize:12, color: form.betType===bt ? game.g[0] : "#F0F0F0" }}>{BET_TYPES[bt]||bt.replace(/_/g," ")}</div>
          </button>
        ))}
      </div>

      <label style={styles.label}>Challenge Description</label>
      <textarea style={{ ...styles.input, resize:"none", marginBottom:12 }} rows={2}
        placeholder={`e.g. "I'll get top 3 in the next ${game.short} match" or "1v1 — I win"`}
        value={form.desc} onChange={e=>sf("desc",e.target.value)} maxLength={300} />

      <label style={styles.label}>Your Side / Selection</label>
      <input style={{ ...styles.input, marginBottom:12 }} placeholder="e.g. your username or 'I win'"
        value={form.selection} onChange={e=>sf("selection",e.target.value)} />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
        <div>
          <label style={styles.label}>Stake ($)</label>
          <input style={styles.input} type="number" min="1" max="10000" placeholder="Min $1" value={form.stake} onChange={e=>sf("stake",e.target.value)} />
        </div>
        <div>
          <label style={styles.label}>Odds (Decimal)</label>
          <input style={styles.input} type="number" min="1.01" step="0.05" placeholder="e.g. 2.00" value={form.odds} onChange={e=>sf("odds",e.target.value)} />
        </div>
      </div>

      <button onClick={()=>setStep(2)} disabled={!ok} style={{ ...styles.gradBtn(game), width:"100%", padding:"13px", fontSize:15, opacity: ok?1:0.5, cursor: ok?"pointer":"not-allowed" }}>
        Review Bet →
      </button>
    </div>
  ) : (
    <div>
      <button onClick={()=>setStep(1)} style={{ background:"none", border:"none", color:"#5580FF", cursor:"pointer", fontSize:13, marginBottom:16, padding:0 }}>← Edit</button>

      <div style={{ background:"#1A1A1A", borderRadius:12, padding:16, marginBottom:16, border:"1px solid #2A2A2A" }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, marginBottom:12, color: game.g[0] }}>📊 BET SUMMARY</div>
        {[
          { l:"Game",            v: game.name },
          { l:"Bet Type",        v: BET_TYPES[form.betType]||form.betType },
          { l:"Challenge",       v: form.desc },
          { l:"Stake",           v: `$${s.toFixed(2)}` },
          { l:"Odds",            v: `${o.toFixed(2)}x` },
          null,
          { l:"Gross Payout",    v: `$${gross.toFixed(2)}` },
          { l:"Commission (10%)",v: `-$${comm.toFixed(2)}`, c:"#FF4444" },
          { l:"🏆 Net Payout",   v: `$${net.toFixed(2)}`, c:"#00C853", bold:true },
        ].map((row,i) => row === null
          ? <hr key={i} style={{ border:"none", borderTop:"1px solid #2A2A2A", margin:"8px 0" }} />
          : (
            <div key={row.l} style={{ display:"flex", justifyContent:"space-between", marginBottom:8, alignItems:"flex-start" }}>
              <span style={{ fontSize:13, color:"#888" }}>{row.l}</span>
              <span style={{ fontWeight:row.bold?900:700, fontSize:row.bold?16:13, color:row.c||"#F0F0F0", fontFamily:row.bold?"'Barlow Condensed',sans-serif":"inherit", maxWidth:"55%", textAlign:"right", wordBreak:"break-word" }}>{row.v}</span>
            </div>
          )
        )}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
        <div>
          <label style={styles.label}>Visibility</label>
          <select style={{ ...styles.input, height:38 }} value={form.visibility} onChange={e=>setForm(p=>({...p,visibility:e.target.value}))}>
            <option value="public">🌍 Public</option>
            <option value="followers">👥 Followers</option>
            <option value="private">🔒 Private</option>
          </select>
        </div>
        <div>
          <label style={styles.label}>Platform</label>
          <div style={{ ...styles.input, height:38, display:"flex", alignItems:"center", cursor:"default" }}>{game.short}</div>
        </div>
      </div>

      <div style={{ background:"rgba(245,124,0,0.1)", border:"1px solid rgba(245,124,0,0.3)", borderRadius:8, padding:"10px 12px", marginBottom:14, fontSize:12, color:"#F9A825" }}>
        ⚠️ <strong>${s.toFixed(2)}</strong> will be locked in escrow until settled. Play honestly and report results accurately.
      </div>

      <button onClick={onSubmit} style={{ ...styles.gradBtn(game), width:"100%", padding:"13px", fontSize:15 }}>
        🎮 Post Bet — Stake ${s.toFixed(2)}
      </button>
    </div>
  );
}

// ─── CHALLENGE FORM ───────────────────────────────────────────────────────────
function ChallengeForm({ game, form, setForm, onSubmit, onCancel }) {
  const s = parseFloat(form.stake)||0, o = parseFloat(form.odds)||0;
  const net = s*o*0.9;
  const sf = (k,v) => setForm(p=>({...p,[k]:v}));

  return (
    <div>
      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:18, padding:12, background:`${game.g[0]}15`, borderRadius:10, border:`1px solid ${game.g[0]}25` }}>
        <div style={{ fontSize:32 }}>{game.icon}</div>
        <div style={{ fontSize:13, color:"#aaa", lineHeight:1.5 }}>
          Challenge any 50/50 Life player to a <strong style={{ color:"#F0F0F0" }}>{game.short}</strong> bet. They'll be notified and can accept or decline within 48h.
        </div>
      </div>

      <label style={styles.label}>Player Username</label>
      <div style={{ position:"relative", marginBottom:12 }}>
        <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#666", fontSize:14 }}>@</span>
        <input style={{ ...styles.input, paddingLeft:28 }} placeholder="kingbettor" value={form.target} onChange={e=>sf("target",e.target.value.replace("@",""))} />
      </div>

      <label style={styles.label}>Challenge Description</label>
      <textarea style={{ ...styles.input, resize:"none", marginBottom:12 }} rows={2}
        placeholder={`e.g. "1v1 ${game.short} match — first to 10 kills wins"`}
        value={form.desc} onChange={e=>sf("desc",e.target.value)} />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        <div>
          <label style={styles.label}>Your Stake ($)</label>
          <input style={styles.input} type="number" min="1" placeholder="50" value={form.stake} onChange={e=>sf("stake",e.target.value)} />
        </div>
        <div>
          <label style={styles.label}>Odds</label>
          <input style={styles.input} type="number" min="1.01" step="0.1" value={form.odds} onChange={e=>sf("odds",e.target.value)} />
        </div>
      </div>

      {s > 0 && (
        <div style={{ background:"#1A1A1A", borderRadius:8, padding:12, marginBottom:14, fontSize:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ color:"#888" }}>If you win (after 10%)</span><span style={{ color:"#00C853", fontWeight:700 }}>+${net.toFixed(2)}</span></div>
          <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ color:"#888" }}>If you lose</span><span style={{ color:"#FF4444", fontWeight:700 }}>-${s.toFixed(2)}</span></div>
        </div>
      )}

      <button onClick={onSubmit} disabled={!form.target||!form.desc||!form.stake}
        style={{ ...styles.gradBtn(game), width:"100%", padding:"13px", fontSize:15, opacity:(!form.target||!form.desc||!form.stake)?0.5:1, cursor:(!form.target||!form.desc||!form.stake)?"not-allowed":"pointer" }}>
        ⚔️ Send Challenge to @{form.target||"?"}
      </button>
    </div>
  );
}

// ─── CARD COMPONENTS ──────────────────────────────────────────────────────────
function HotCard({ game, onClick }) {
  return (
    <div onClick={onClick} style={{ flexShrink:0, width:148, cursor:"pointer", borderRadius:14, background:`linear-gradient(135deg,${game.g[0]},${game.g[1]})`, border:"1px solid rgba(255,255,255,0.1)", padding:"14px 12px", transition:"all 0.2s", position:"relative", overflow:"hidden" }}>
      <div style={{ fontSize:30, marginBottom:6 }}>{game.icon}</div>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:15, color:"white", lineHeight:1.2, marginBottom:5 }}>{game.short}</div>
      <div style={{ fontSize:11, color:"rgba(255,255,255,0.65)", marginBottom:8 }}>{game.bets} open bets</div>
      <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:6, padding:"3px 8px", fontSize:11, color:"white", fontWeight:700, display:"inline-block" }}>Bet Now →</div>
      {game.verified && <div style={{ position:"absolute", top:8, right:8, fontSize:12 }}>✅</div>}
    </div>
  );
}

function GameCard({ game, onClick }) {
  const cat = CATEGORIES[game.cat];
  return (
    <div onClick={onClick} style={{ background:"#161616", border:"1px solid #2A2A2A", borderRadius:14, overflow:"hidden", cursor:"pointer", transition:"all 0.2s", display:"flex", flexDirection:"column" }}>
      <div style={{ height:4, background:`linear-gradient(90deg,${game.g[0]},${game.g[1]})` }} />
      <div style={{ padding:"14px 14px 10px", flex:1, display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:9 }}>
          <div style={{ width:46, height:46, borderRadius:10, flexShrink:0, background:`linear-gradient(135deg,${game.g[0]},${game.g[1]})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{game.icon}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
              <span style={{ fontWeight:900, fontSize:13, lineHeight:1.2, color:"#F0F0F0" }}>{game.name}</span>
              {game.verified && <span style={{ fontSize:10, color:"#5580FF" }}>✅</span>}
            </div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              <span style={{ fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:10, background:`${game.g[0]}22`, color:game.g[0], border:`1px solid ${game.g[0]}44` }}>{cat?.icon} {cat?.label}</span>
              {game.popular && <span style={{ fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:10, background:"rgba(204,0,0,0.15)", color:"#CC0000" }}>HOT</span>}
            </div>
          </div>
        </div>

        <p style={{ fontSize:11, color:"#777", lineHeight:1.4, marginBottom:9, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", flex:1 }}>{game.desc}</p>

        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:9 }}>
          {game.tags.slice(0,3).map(t => <span key={t} style={{ fontSize:9, color:"#555", padding:"2px 6px", borderRadius:10, background:"#1E1E1E", border:"1px solid #2A2A2A" }}>{t}</span>)}
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10, paddingTop:8, borderTop:"1px solid #222" }}>
          <div style={{ fontSize:10, color:"#555" }}>👥 {game.players.toLocaleString()}</div>
          <div style={{ fontSize:10, color:"#F57C00" }}>🎯 {game.bets} bets</div>
          <div style={{ fontSize:10, color:"#00C853" }}>🏆 ${game.prize}</div>
        </div>

        <div style={{ width:"100%", padding:"8px 0", borderRadius:8, background:`linear-gradient(135deg,${game.g[0]},${game.g[1]})`, border:"none", color:"white", fontWeight:900, fontSize:12, cursor:"pointer", textAlign:"center", fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.03em" }}>
          🎯 VIEW BETS & CHALLENGE
        </div>
      </div>
    </div>
  );
}

function BetListCard({ bet, game }) {
  const s = bet.stake, o = bet.odds;
  return (
    <div style={{ background:"#161616", border:"1px solid #2A2A2A", borderRadius:12, overflow:"hidden", marginBottom:10 }}>
      <div style={{ height:3, background:`linear-gradient(90deg,${game.g[0]},${game.g[1]})` }} />
      <div style={{ padding:"12px 14px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:14, color:"#F0F0F0", marginBottom:4 }}>{bet.desc}</div>
            <div style={{ fontSize:11, color:"#555" }}>@{bet.creator || "you"} · {BET_TYPES[bet.betType]||bet.betType}</div>
          </div>
          <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, background:"rgba(0,200,83,0.15)", color:"#00C853" }}>● OPEN</span>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10, background:"#1A1A1A", borderRadius:8, padding:"10px 12px" }}>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:10, color:"#555", marginBottom:2 }}>STAKE</div><div style={{ fontWeight:900, fontSize:16, color:"#F0F0F0" }}>${s.toFixed(2)}</div></div>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:10, color:"#555", marginBottom:2 }}>ODDS</div><div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:"#F57C00" }}>{o.toFixed(2)}</div></div>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:10, color:"#555", marginBottom:2 }}>COMMISSION</div><div style={{ fontWeight:700, fontSize:14, color:"#FF4444" }}>-${(s*o*0.10).toFixed(2)}</div></div>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:10, color:"#555", marginBottom:2 }}>NET PAYOUT</div><div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:"#00C853" }}>${(s*o*0.9).toFixed(2)}</div></div>
        </div>
        <button style={{ width:"100%", padding:"8px", borderRadius:8, background:`linear-gradient(135deg,${game.g[0]},${game.g[1]})`, border:"none", color:"white", fontWeight:900, fontSize:13, cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif" }}>
          ⚔️ ACCEPT BET
        </button>
      </div>
    </div>
  );
}

function EmptyBets({ game, onBet }) {
  return (
    <div style={{ textAlign:"center", padding:"50px 20px", color:"#555" }}>
      <div style={{ fontSize:48, marginBottom:12 }}>{game.icon}</div>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, marginBottom:8, color:"#F0F0F0" }}>No open bets yet</div>
      <div style={{ fontSize:13, marginBottom:20 }}>Be the first to create a {game.short} bet challenge!</div>
      <button onClick={onBet} style={{ ...styles.gradBtn(game), padding:"12px 24px", fontSize:15 }}>
        🎯 Create First Bet
      </button>
    </div>
  );
}

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16, backdropFilter:"blur(4px)" }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"#161616", border:"1px solid #2A2A2A", borderRadius:20, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 20px", borderBottom:"1px solid #2A2A2A" }}>
          <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, margin:0, color:"#F0F0F0" }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:20, lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:20 }}>{children}</div>
      </div>
    </div>
  );
}

function CategoryPill({ active, color, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding:"5px 14px", borderRadius:20, border:`1px solid ${active?color:"#2A2A2A"}`,
      background: active ? `${color}22` : "transparent",
      color: active ? color : "#666",
      fontWeight:700, fontSize:11, cursor:"pointer", flexShrink:0, whiteSpace:"nowrap", transition:"all 0.15s"
    }}>{children}</button>
  );
}

function BetTypePill({ active, color, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding:"4px 12px", borderRadius:20, border:`1px solid ${active?color:"#2A2A2A"}`,
      background: active ? `${color}22` : "transparent",
      color: active ? color : "#555",
      fontWeight:700, fontSize:11, cursor:"pointer", flexShrink:0, whiteSpace:"nowrap", transition:"all 0.15s"
    }}>{children}</button>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
      <span style={{ fontSize:16 }}>{icon}</span>
      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:"#F0F0F0" }}>{title}</span>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = {
  root: {
    fontFamily:"'Barlow',system-ui,sans-serif",
    background:"#0D0D0D",
    color:"#F0F0F0",
    minHeight:"100vh",
  },
  hero: {
    background:"linear-gradient(135deg,#0D0D0D 0%,#1a0000 40%,#000d33 100%)",
    borderBottom:"1px solid #2A2A2A",
    padding:"28px 20px 20px",
    position:"relative",
    overflow:"hidden",
  },
  heroOverlay: {
    position:"absolute", top:"50%", left:"50%",
    transform:"translate(-50%,-50%)",
    fontFamily:"'Barlow Condensed',sans-serif",
    fontWeight:900, fontSize:150, opacity:0.03,
    color:"white", letterSpacing:-6, userSelect:"none",
    whiteSpace:"nowrap",
    content:"GAME BET",
    pointerEvents:"none",
  },
  heroTitle: {
    fontFamily:"'Barlow Condensed',sans-serif",
    fontWeight:900, fontSize:48, lineHeight:1, marginBottom:10,
  },
  heroSub: {
    fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.5, marginBottom:18, maxWidth:480,
  },
  statRow: {
    display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10,
  },
  statBox: {
    background:"rgba(255,255,255,0.05)", borderRadius:10, padding:"10px 12px",
    border:"1px solid rgba(255,255,255,0.08)", textAlign:"center",
  },
  input: {
    background:"#1A1A1A", border:"1px solid #2A2A2A", borderRadius:8,
    padding:"9px 12px", color:"#F0F0F0", fontSize:14, width:"100%",
    outline:"none", boxSizing:"border-box", transition:"border-color 0.15s",
    fontFamily:"'Barlow',sans-serif",
  },
  label: {
    display:"block", fontSize:11, fontWeight:700, color:"#666",
    textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5,
  },
  gradBtn: (game) => ({
    background:`linear-gradient(135deg,${game.g[0]},${game.g[1]})`,
    border:"none", borderRadius:10, color:"white",
    fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900,
    cursor:"pointer", transition:"opacity 0.15s", letterSpacing:"0.02em",
  }),
  toast: {
    position:"fixed", top:20, right:20, zIndex:9999, padding:"12px 20px",
    borderRadius:10, color:"white", fontWeight:700, fontSize:14,
    boxShadow:"0 4px 20px rgba(0,0,0,0.5)", animation:"fadeIn 0.2s",
    maxWidth:360,
  },
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
function getMockBets(game) {
  return [
    { id:1, betType:"head_to_head",    desc:`1v1 ${game.short} match — $50 on the line`, stake:50,  odds:2.0,  creator:"kingbettor" },
    { id:2, betType:"match_winner",    desc:`${game.short} — top placement bet this session`, stake:25, odds:1.85, creator:"pro_gamer99" },
    { id:3, betType:"kill_count",      desc:`Over 8 kills in next ${game.short} game`, stake:100, odds:1.70, creator:"sharp_shooter" },
    { id:4, betType:"custom_challenge",desc:`${game.short} weekly challenge — highest score wins`, stake:30, odds:2.20, creator:"esports_king" },
  ].filter(b => game.types.includes(b.betType) || game.types.includes("custom_challenge"));
}

function getMockLB(id) {
  return [
    { u:"kingbettor",   wins:47, rate:60, profit:2340 },
    { u:"pro_gamer99",  wins:38, rate:58, profit:1870 },
    { u:"sharp_shooter",wins:31, rate:60, profit:1540 },
    { u:"lucky_ace",    wins:29, rate:52, profit:1120 },
    { u:"esports_king", wins:22, rate:54, profit:890  },
    { u:"game_master",  wins:19, rate:50, profit:650  },
  ];
}

function getMockPosts(game) {
  return [
    { id:1, u:"kingbettor",   c:`Just hit a 5-match winning streak in ${game.short}! Who wants to challenge me? 🎮 Putting $100 on my next 3 games 💰`, l:34, r:12, t:"2h ago", bet:true },
    { id:2, u:"pro_gamer99",  c:`${game.short} meta has shifted so much this season. Top tier players look completely different from last month.`, l:21, r:8,  t:"5h ago", bet:false },
    { id:3, u:"lucky_ace",    c:`Lost a $50 bet on ${game.short} yesterday 😢 GG to @sharp_shooter though, clean win. Rematch?`, l:18, r:15, t:"1d ago", bet:true },
    { id:4, u:"esports_king", c:`Tip for ${game.short} bets: always check last 10 game form, not career stats. Recent performance = everything 📊`, l:56, r:22, t:"2d ago", bet:false },
  ];
}
