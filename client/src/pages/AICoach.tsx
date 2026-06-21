import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, RotateCcw, ExternalLink, ChevronRight, Sparkles, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAppData } from '@/hooks/useAppData'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'ai' | 'user'
  content: string
  options?: string[]
  report?: TrainingReport
}

interface TrainingArea {
  skill: string
  score: number
  priority: 'critical' | 'high' | 'medium'
  advice: string
  drills: { title: string; url: string }[]
}

interface WeekDay {
  day: string
  focus: string
  duration: string
  videos: { title: string; url: string }[]
}

interface TrainingReport {
  summary: string
  areas: TrainingArea[]
  weeklyPlan: WeekDay[]
}

// ─── YouTube search links (always work, never 404) ───────────────────────────

function ytSearch(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}

const VIDEOS: Record<string, { title: string; url: string }[]> = {
  '1v1_defending': [
    { title: 'How to Win 1v1 Defending Situations', url: ytSearch('how to win 1v1 defending soccer tutorial') },
    { title: 'Defensive Body Shape & Jockeying', url: ytSearch('soccer defensive jockeying body shape tutorial') },
    { title: '1v1 Defending Drills for Solo Training', url: ytSearch('1v1 defending solo drills soccer') },
  ],
  '1v1_attacking': [
    { title: 'How to Beat Defenders 1v1', url: ytSearch('how to beat defenders 1v1 soccer tutorial') },
    { title: 'Dribbling Moves for Wingers', url: ytSearch('best dribbling moves for wingers soccer tutorial') },
    { title: 'Body Feints & Shoulder Drops', url: ytSearch('body feint shoulder drop soccer skill tutorial') },
  ],
  aerial_duels: [
    { title: 'How to Win Aerial Duels & Headers', url: ytSearch('how to win aerial duels headers soccer tutorial') },
    { title: 'Heading Technique for Strikers', url: ytSearch('heading technique strikers soccer tutorial') },
    { title: 'Jump Timing for Aerial Battles', url: ytSearch('jump timing aerial duels soccer training') },
  ],
  dribbling_tight: [
    { title: 'Dribbling in Tight Spaces Tutorial', url: ytSearch('dribbling tight spaces small areas soccer tutorial') },
    { title: 'Close Control Drills (10 Yards or Less)', url: ytSearch('close control drills 10 yards soccer training') },
    { title: 'La Croqueta & Drag-Back in Tight Areas', url: ytSearch('la croqueta drag back soccer skill tight spaces') },
  ],
  crossing: [
    { title: 'How to Cross the Ball Like a Pro', url: ytSearch('how to cross the ball soccer winger tutorial') },
    { title: 'Early Cross vs Whipped Cross Technique', url: ytSearch('crossing technique winger early cross soccer') },
    { title: 'Winger Crossing & Final Third Training', url: ytSearch('winger crossing final third soccer training drills') },
  ],
  finishing: [
    { title: 'Clinical Finishing Drills for Strikers', url: ytSearch('clinical finishing drills strikers soccer tutorial') },
    { title: 'Composure in Front of Goal', url: ytSearch('composure in front of goal soccer tutorial') },
    { title: 'Weak Foot Finishing Training', url: ytSearch('weak foot finishing training soccer tutorial') },
  ],
  hold_up_play: [
    { title: 'Hold-Up Play & Link-Up for Strikers', url: ytSearch('hold up play link up striker soccer tutorial') },
    { title: 'Back-to-Goal Striker Technique', url: ytSearch('back to goal striker technique soccer tutorial') },
    { title: 'Physical Strength for Strikers', url: ytSearch('physical strength striker hold up play soccer') },
  ],
  pressing: [
    { title: 'How to Press High & Win the Ball Back', url: ytSearch('high press soccer how to press win ball back') },
    { title: 'Striker Pressing Triggers & Timing', url: ytSearch('striker pressing triggers timing soccer tutorial') },
    { title: 'Counter Press Tactics', url: ytSearch('counter press soccer tutorial tactics') },
  ],
  passing: [
    { title: 'Combination Play & Quick Passing', url: ytSearch('combination play quick passing soccer tutorial') },
    { title: 'One-Two Passes & Third Man Runs', url: ytSearch('one two passes third man runs soccer tutorial') },
    { title: 'Rondo & Possession Drills', url: ytSearch('rondo possession drill soccer training') },
  ],
  reading_game: [
    { title: 'How to Read the Game Like a Pro', url: ytSearch('how to read the game soccer positioning tutorial') },
    { title: 'Scanning & Awareness Before Receiving', url: ytSearch('scanning awareness before receiving soccer tutorial') },
    { title: 'Midfielder Positioning & Decision Making', url: ytSearch('midfielder positioning decision making soccer tutorial') },
  ],
  distribution_gk: [
    { title: 'Goalkeeper Distribution Technique', url: ytSearch('goalkeeper distribution technique tutorial soccer') },
    { title: 'GK Long Ball & Short Passing Options', url: ytSearch('goalkeeper long ball short passing soccer tutorial') },
    { title: 'Build From the Back — GK Role', url: ytSearch('build from back goalkeeper role soccer tutorial') },
  ],
  gk_shot_stopping: [
    { title: 'Shot Stopping Technique for Goalkeepers', url: ytSearch('shot stopping technique goalkeeper soccer tutorial') },
    { title: 'Goalkeeper Diving & Positioning', url: ytSearch('goalkeeper diving positioning tutorial soccer') },
    { title: 'Reaction Saves Training', url: ytSearch('reaction saves goalkeeper training soccer') },
  ],
  gk_1v1: [
    { title: 'GK 1v1 Situations — How to Save', url: ytSearch('goalkeeper 1v1 situations how to save soccer') },
    { title: 'Coming Off Your Line — GK Decisions', url: ytSearch('goalkeeper coming off line decisions soccer tutorial') },
    { title: 'Angle Play for Goalkeepers', url: ytSearch('angle play goalkeeper soccer tutorial') },
  ],
  defensive_positioning: [
    { title: 'Defensive Positioning & Line Holding', url: ytSearch('defensive positioning line holding soccer tutorial') },
    { title: 'How to Play Sweeper-Keeper & Offside Trap', url: ytSearch('offside trap defensive line soccer tutorial') },
    { title: 'Centre-Back Positioning & Communication', url: ytSearch('centre back positioning communication soccer tutorial') },
  ],
  recovery_runs: [
    { title: 'Recovery Run Technique for Defenders', url: ytSearch('recovery run technique defenders soccer tutorial') },
    { title: 'Tracking Runs & Covering Spaces', url: ytSearch('tracking runs covering spaces defenders soccer') },
    { title: 'Fullback Transition — Attack to Defence', url: ytSearch('fullback transition attack to defence soccer tutorial') },
  ],
  cdm_screening: [
    { title: 'Defensive Midfielder Screening Tutorial', url: ytSearch('defensive midfielder screening pressing soccer tutorial') },
    { title: 'CDM Positioning & Interceptions', url: ytSearch('CDM positioning interceptions soccer tutorial') },
    { title: 'Breaking Lines as a CDM', url: ytSearch('CDM breaking lines forward passes soccer') },
  ],
  off_ball_movement: [
    { title: 'Off the Ball Movement & Runs', url: ytSearch('off the ball movement runs soccer tutorial') },
    { title: 'Creating Space for Teammates', url: ytSearch('creating space teammates runs soccer tutorial') },
    { title: 'Striker / Winger Run Timing', url: ytSearch('striker winger run timing soccer tutorial') },
  ],
  sprint_speed: [
    { title: 'Explosive Sprint Speed Training for Soccer', url: ytSearch('explosive sprint speed training soccer tutorial') },
    { title: 'Acceleration Drills — First 5 Metres', url: ytSearch('acceleration drills first 5 metres soccer training') },
    { title: 'Sprint Mechanics for Footballers', url: ytSearch('sprint mechanics footballers training tutorial') },
  ],
}

// ─── Position question sets ───────────────────────────────────────────────────

type PositionGroup = 'GK' | 'CB' | 'FB' | 'CDM' | 'CM' | 'CAM' | 'W' | 'ST'

function getPositionGroup(pos: string): PositionGroup {
  if (pos === 'GK') return 'GK'
  if (['CB'].includes(pos)) return 'CB'
  if (['LB', 'RB'].includes(pos)) return 'FB'
  if (['CDM'].includes(pos)) return 'CDM'
  if (['CM'].includes(pos)) return 'CM'
  if (['CAM'].includes(pos)) return 'CAM'
  if (['LW', 'RW', 'LM', 'RM'].includes(pos)) return 'W'
  if (['CF', 'ST'].includes(pos)) return 'ST'
  return 'CM'
}

interface Question {
  id: string
  text: string
  options: string[]
  videoKey: string
  lowAdvice: string
  highAdvice: string
}

const QUESTION_SETS: Record<PositionGroup, Question[]> = {
  GK: [
    {
      id: 'shot_stopping', text: 'How often do you save shots that are on target and reachable?',
      options: ['Rarely — I concede most shots I should save', 'Sometimes — inconsistent', 'Usually — I stop most shots', 'Almost always — shot-stopping is my strength'],
      videoKey: 'gk_shot_stopping',
      lowAdvice: 'Shot-stopping is your core job. Work daily on your set position and explosive dive mechanics. Start with low-driven shots, then add height. Your hands and footwork must react before your brain catches up.',
      highAdvice: 'You\'re solid at stopping shots. Now focus on your positioning before the shot — are you at the right angle and depth to cover both posts? Small adjustments here make saves feel effortless.',
    },
    {
      id: 'gk_1v1', text: 'In 1v1 situations (attacker through on goal), how confident are you?',
      options: ['Very nervous — I often get beaten', 'Inconsistent — sometimes I get it right', 'Usually good — I narrow the angle well', 'Very confident — I win most 1v1s'],
      videoKey: 'gk_1v1',
      lowAdvice: '1v1s are about closing the angle fast and staying big. Sprint off your line to reduce the attacker\'s options, then hold your shape. Never dive too early — wait for the touch or the shot.',
      highAdvice: 'Good 1v1 reading. Push further: work on "half-saves" where you don\'t fully stop the ball but block the near post and force it wide. And improve your recovery if the first save rebounds.',
    },
    {
      id: 'distribution_gk', text: 'How is your distribution — short passes to defenders, long balls, goal kicks?',
      options: ['Weak — I give possession away often', 'Average — I play it safe but limit options', 'Good — I find teammates consistently', 'Excellent — I trigger attacks from the back'],
      videoKey: 'distribution_gk',
      lowAdvice: 'Distribution is the 12th outfield player. Start simple — short roll to the nearest CB under no pressure. Build up to switching play with longer balls. Under pressure: safety first, always.',
      highAdvice: 'Your distribution is an asset. Now add variety — can you switch play to the opposite fullback in one? Can you play the long ball over the press to your striker\'s feet? These kill high presses.',
    },
    {
      id: 'aerial_duels', text: 'How dominant are you coming out for crosses and set pieces?',
      options: ['I stay on my line — crosses are a weakness', 'I come out sometimes but misjudge', 'I command my box most of the time', 'I dominate my area — crosses are my strength'],
      videoKey: 'aerial_duels',
      lowAdvice: 'Claiming crosses builds confidence for your whole defence. Start with zero pressure — catch every ball thrown into your box. Add a passive defender, then active. Your call ("KEEPER!") must be loud and early.',
      highAdvice: 'Commanding your box is great. Extend this — can you dominate the 6-yard box on all corner deliveries? And work on punching under heavy contact when you can\'t hold cleanly.',
    },
    {
      id: 'reading_game', text: 'How well do you read danger — positioning before shots, organising your defence?',
      options: ['I react but struggle to anticipate', 'I read simple danger but miss complex patterns', 'Good — I position well and organise defenders', 'Excellent — I see danger before it develops'],
      videoKey: 'reading_game',
      lowAdvice: 'Goalkeepers must be the eyes of the team. Watch the ball and the runners at the same time. Constant verbal communication with your defenders — you see everything they can\'t.',
      highAdvice: 'Great game reading. Push this further: track the second phase. When you stop a corner, where does the second ball fall? Position for that, not just the first save.',
    },
  ],

  CB: [
    {
      id: 'aerial_duels', text: 'How dominant are you in aerial duels — defending crosses, set pieces, long balls?',
      options: ['I lose most headers — it\'s a weakness', 'I win about half — inconsistent', 'I win most headers in my zone', 'I dominate aerially — it\'s my biggest strength'],
      videoKey: 'aerial_duels',
      lowAdvice: 'As a CB, aerial ability is non-negotiable. Work on attacking the ball — not waiting for it. Run into your jump 2 steps before the ball arrives. Aim for the highest point, head through the ball.',
      highAdvice: 'Strong in the air. Now work on your header placement — when clearing, head away from the danger zone (not straight back) and when attacking corners, pick your spot early.',
    },
    {
      id: '1v1_defending', text: 'In 1v1 defending when a striker runs at you, how often do you come out on top?',
      options: ['I get beaten regularly — this is a big weakness', 'I hold my own sometimes', 'I usually contain attackers well', 'Rarely beaten 1v1 — defending is my strength'],
      videoKey: '1v1_defending',
      lowAdvice: 'Don\'t dive in — that\'s a CB\'s biggest mistake. Stay between the attacker and goal, delay, and wait for backup. Your job is to steer them away from goal, not always win the ball clean.',
      highAdvice: 'Good 1v1 defending. Work on reading the attacker\'s body shape earlier — can you spot which foot they prefer before they show you? That lets you force them weaker earlier.',
    },
    {
      id: 'defensive_positioning', text: 'How is your defensive positioning — staying on the right side of runners, holding the line?',
      options: ['I get caught out of position often', 'I manage basic positioning but get caught on runs', 'My positioning is generally solid', 'Excellent — I\'m always in the right spot'],
      videoKey: 'defensive_positioning',
      lowAdvice: 'Positioning is a CB\'s most important skill. You should never be caught flat-footed. Open your body to see ball and runner simultaneously. Never let a runner get behind you — drop before it\'s too late.',
      highAdvice: 'Solid positioning. Now work on the offside trap — coordinating with your partner CB to step together. Timing is everything. Also practice holding your line when the GK claims balls.',
    },
    {
      id: 'passing', text: 'How confident are you playing out from the back under pressure?',
      options: ['I panic and go long whenever pressed', 'I can play short passes but struggle under pressure', 'I play out well in most situations', 'I love being pressed — I always find a way through'],
      videoKey: 'passing',
      lowAdvice: 'Modern CBs must be comfortable under pressure. Start by improving your first touch — a heavy touch under pressure means a lost ball. Practice receiving and playing one-touch in tight areas.',
      highAdvice: 'Good composure on the ball. Extend your range — can you switch play 40 yards to the opposite fullback with pace and accuracy? Long diagonal passes under no pressure should be second nature.',
    },
    {
      id: 'recovery_runs', text: 'How good are your recovery runs when caught out of position or beaten in behind?',
      options: ['Slow to recover — a major weakness', 'Average — I recover sometimes', 'I recover well most of the time', 'Very fast recovery — I rarely get beaten in behind'],
      videoKey: 'recovery_runs',
      lowAdvice: 'If you get beaten, sprint recovery is the only thing that saves you. Train explosive 30m sprints and practice getting goal-side quickly. Never stop running until the danger is gone.',
      highAdvice: 'Good recovery pace. Work on your transition moment — the split second you realize you\'re beaten, are you already turning to sprint? The delay between "beaten" and "recovering" is where goals happen.',
    },
  ],

  FB: [
    {
      id: '1v1_defending', text: 'How well do you handle wingers running at you 1v1 down your flank?',
      options: ['I get beaten regularly — it\'s a real problem', 'I cope sometimes but get caught', 'I contain most wingers well', 'I shut down wingers consistently'],
      videoKey: '1v1_defending',
      lowAdvice: 'Defending against wingers is about channelling. Show them inside (towards cover) or outside depending on the team\'s defensive shape. Never fully commit — stay on your feet and delay.',
      highAdvice: 'Good against wingers. Now sharpen your pressing triggers — when is the right moment to step up? It\'s when they take a heavy touch or turn away. Wait for it, then be aggressive.',
    },
    {
      id: 'crossing', text: 'When you get forward, how is your crossing and delivery into the box?',
      options: ['Weak — my crosses rarely find teammates', 'Inconsistent — sometimes good, sometimes not', 'Good — I deliver with accuracy most times', 'Excellent — my deliveries create real chances'],
      videoKey: 'crossing',
      lowAdvice: 'Crossing is a fullback\'s attacking weapon. Work on whipped crosses (inside of foot, across goal) and early crosses before the defence sets. Pick your target BEFORE you cross — not during.',
      highAdvice: 'Good delivery. Now vary it: early cross when the striker makes the run, cutback when they\'ve overshot. Defenders can\'t prepare for both. Work on the right foot cross as a left back (and vice versa).',
    },
    {
      id: 'off_ball_movement', text: 'How good are your attacking runs — timing overlaps, underlaps, and knowing when to stay?',
      options: ['I rarely get forward — timing is off', 'I go forward but the moment is usually wrong', 'I time my runs well most of the time', 'My attacking runs constantly create overloads'],
      videoKey: 'off_ball_movement',
      lowAdvice: 'Overlap timing is everything. Go when your winger has the ball and faces the defender — that\'s when your run stretches the defence. Going too early telegraphs it; too late and the moment is gone.',
      highAdvice: 'Good attacking instincts. Work on the underlap (coming inside the winger) — this is unexpected and creates space in different zones. Also: know when NOT to go forward — read when your team needs defensive cover.',
    },
    {
      id: 'recovery_runs', text: 'When you\'ve pushed forward, how quickly do you recover if the ball is lost?',
      options: ['Slow to get back — I leave gaps often', 'I try to get back but often too late', 'I recover well most of the time', 'First to track back — transition is a strength'],
      videoKey: 'recovery_runs',
      lowAdvice: 'Fullback transition is critical. The moment possession is lost, sprint back — no walking. Your cover shadow (the lane between ball and goal) must be closed before the opposition counter.',
      highAdvice: 'Great transition discipline. Now sharpen when you judge it\'s safe to press high vs tracking back. Can you read the opposition\'s counter-attack shape before the ball is lost?',
    },
    {
      id: 'dribbling_tight', text: 'Can you beat a player 1v1 when you\'ve overlapped and the space is tight?',
      options: ['I usually cross or pass — not a dribbler', 'I can hold the ball but struggle to go by people', 'I beat players sometimes in these situations', 'I\'m comfortable carrying the ball in tight areas'],
      videoKey: 'dribbling_tight',
      lowAdvice: 'Modern fullbacks need a trick or two near the byline. Learn one reliable feint — a stepover into a cut inside. You only need one good move to create a crossing opportunity.',
      highAdvice: 'Good ball carrying. Add a Rabona or cutback fake into your toolkit near the byline. When defenders expect the cross, the cut back or inside dribble creates entirely different problems for them.',
    },
  ],

  CDM: [
    {
      id: 'cdm_screening', text: 'How effective are you at screening — blocking passes into your striker and intercepting?',
      options: ['I react to the ball rather than screen space', 'I intercept sometimes but leave gaps', 'I screen well and cut many passes off', 'I read the game excellently — I screen everything'],
      videoKey: 'cdm_screening',
      lowAdvice: 'Screening is 90% positioning, 10% athleticism. You should always be between the ball and the dangerous pass option. Shadow the most dangerous runner, not just the ball.',
      highAdvice: 'Excellent screening instincts. Now add anticipation: can you read the trigger that tells you a through ball is coming 0.5 seconds before it\'s played? That\'s what elite CDMs do.',
    },
    {
      id: '1v1_defending', text: 'When pressed in midfield and someone drives at you, how do you handle 1v1 defending?',
      options: ['I dive in and often get beaten', 'I hold my ground but don\'t often win the ball', 'I contain well and usually win it', 'I\'m dominant in midfield 1v1s'],
      videoKey: '1v1_defending',
      lowAdvice: 'In midfield 1v1s, your job is to delay and channel — not necessarily to win the ball every time. Stay on your feet, force them away from goal, and give your team time to get organized.',
      highAdvice: 'Strong in midfield duels. Work on your tackle timing — specifically the block tackle. Your window to tackle in midfield is narrower than in defence, so precision matters more than aggression.',
    },
    {
      id: 'passing', text: 'How good are you at recycling possession and breaking lines with your passing?',
      options: ['I play it safe and sideways — I don\'t break lines', 'I try to play forward but often give it away', 'I find forward passes in good moments', 'I constantly break defensive lines with my passing'],
      videoKey: 'passing',
      lowAdvice: 'CDMs who only play sideways are predictable. Work on identifying the "pocket" — the space between the opposition\'s midfield and defence. A ball into that pocket unlocks defences. Start playing it when you\'re under no pressure.',
      highAdvice: 'Great range of passing. Work on your "switch of play" — can you move the ball 30-40 yards instantly to change the angle of attack? This is what the best CDMs use to pull defences apart.',
    },
    {
      id: 'aerial_duels', text: 'How do you handle aerial duels when the ball is played long over the top?',
      options: ['I lose most aerial duels — it\'s a weakness', 'I compete but inconsistently', 'I win my share of aerial battles', 'I dominate in the air for my position'],
      videoKey: 'aerial_duels',
      lowAdvice: 'CDM aerial ability is underrated. You\'ll face direct balls frequently. Work on reading the flight of the ball from the goalkeeper — you have more time than you think to position for the header.',
      highAdvice: 'Solid in the air. Work on "flick-ons" vs "wins" — sometimes the best aerial play is redirecting the ball for a runner rather than trying to head it back safely.',
    },
    {
      id: 'reading_game', text: 'How well do you read when your team is about to lose the ball and position yourself?',
      options: ['I react after we lose it — always behind the play', 'I sometimes anticipate but often caught off guard', 'I read transitions well most of the time', 'I\'m almost always in position before we lose the ball'],
      videoKey: 'reading_game',
      lowAdvice: 'Transition reading is the #1 CDM skill. Watch your own team\'s body language — a stretched fullback, a forced first touch — these signal you\'re about to lose the ball. Be in position BEFORE it happens.',
      highAdvice: 'Excellent transition reading. Now work on pressing triggers as a CDM — can you coordinate your team\'s press? You\'re the one who calls when to step and when to drop.',
    },
  ],

  CM: [
    {
      id: 'passing', text: 'How is your combination play and passing in tight midfield areas under pressure?',
      options: ['I panic and lose the ball under pressure', 'I play it safe but miss good forward options', 'I combine well and find pockets', 'I thrive under pressure — I love tight combinations'],
      videoKey: 'passing',
      lowAdvice: 'Central midfield is the engine room and receiving the ball under pressure is the hardest skill. Train rondos daily — 4v1 or 5v2. The repetition builds the habit of scanning before the ball arrives.',
      highAdvice: 'Good composure in tight areas. Level up with "third man combinations" — using one-twos to get the third player free in space. Watch how De Bruyne and Modric create chances this way.',
    },
    {
      id: 'reading_game', text: 'How well do you read where spaces will appear and position yourself ahead of the ball?',
      options: ['I react to the ball — I\'m rarely in space when it arrives', 'I find space sometimes but miss a lot', 'I position well between the lines regularly', 'I\'m constantly available in the right space'],
      videoKey: 'reading_game',
      lowAdvice: 'Midfield movement off the ball is underrated. When your team has the ball, you should constantly be adjusting your position to be an option. If you\'re standing still, you\'re not helping.',
      highAdvice: 'Great game intelligence. Push further: can you ghost into the box at the right moment to score from distance or on second balls? The box-to-box midfielder who can arrive late into the box is elite.',
    },
    {
      id: 'dribbling_tight', text: 'When you receive the ball under pressure with little time and space, how do you cope?',
      options: ['I lose the ball — tight spaces are a weakness', 'I can hold it but struggle to turn and go', 'I manage tight spaces reasonably well', 'I thrive in tight spaces — I love the press'],
      videoKey: 'dribbling_tight',
      lowAdvice: 'Receiving under pressure starts with your body shape before the ball arrives. Open your body so you can see the field. Then your first touch must take it away from pressure, not into it.',
      highAdvice: 'Good close control. Work on the "back-heel escape" and "turn-and-go" in tight spaces. These moves in midfield transition matches into attacks instantly.',
    },
    {
      id: '1v1_defending', text: 'When an opposition midfielder drives at you, how effective are you at stopping them?',
      options: ['I get beaten and have to foul — a real issue', 'I slow them down but don\'t often win it', 'I contain well and win the ball fairly often', 'I win most midfield 1v1 duels'],
      videoKey: '1v1_defending',
      lowAdvice: 'Midfield 1v1 defending is about cutting the angle. Don\'t rush in — make them decide where to go, then pounce when the first touch is heavy. Winning the ball in midfield is the first step of a counter-attack.',
      highAdvice: 'Solid midfield defending. Work on "press timing" — stepping to the ball carrier the moment they receive it with their back to goal. In that split-second, they\'re vulnerable.',
    },
    {
      id: 'off_ball_movement', text: 'How good are your off-ball runs — arriving into the box, making yourself available?',
      options: ['I don\'t run much off the ball', 'I make some runs but rarely into good positions', 'I make good runs and get into good positions', 'I\'m always threatening off the ball'],
      videoKey: 'off_ball_movement',
      lowAdvice: 'As a CM, making 2-3 intelligent off-ball runs per half is enough to score or assist. Time your run into the box for when the winger has the ball — arrive just as they\'re about to cross.',
      highAdvice: 'Great off-ball movement. Work on the "late run" specifically — staying outside the box until the exact moment, then sprinting in. Defenders hate this because they lose you.',
    },
  ],

  CAM: [
    {
      id: 'reading_game', text: 'How quickly do you find pockets of space between the opposition\'s lines?',
      options: ['I struggle to find space — defenders track me easily', 'I find space sometimes but disappear for long periods', 'I find space regularly and stay involved', 'I constantly find dangerous pockets and cause problems'],
      videoKey: 'reading_game',
      lowAdvice: 'As a 10, finding pockets between the lines is your entire job. You must be constantly moving to make yourself available — drift, then check back, then drift again. Make defenders make a decision.',
      highAdvice: 'Great spatial awareness. Work on your movement in the final third specifically — can you combine quick turn-and-shoot with a layoff to a runner? These one-two movements at pace are devastating.',
    },
    {
      id: 'passing', text: 'How creative and accurate is your through-ball and key pass delivery?',
      options: ['My key passes are inaccurate or too late', 'I play key passes sometimes but not consistently', 'I deliver consistently good key passes', 'My through balls constantly unlock defences'],
      videoKey: 'passing',
      lowAdvice: 'The "killer pass" is a CAM\'s superpower. Work on playing the ball into space (where the runner will be), not to where they are now. This requires scanning 2-3 seconds before you receive.',
      highAdvice: 'Elite passing vision. Add the "no-look pass" into your toolkit — looking one way and passing the other disorients defenders. But only do this when the pass is simple and rehearsed.',
    },
    {
      id: 'dribbling_tight', text: 'How do you handle pressure in tight spaces when defenders close you down quickly?',
      options: ['I get dispossessed under pressure easily', 'I can hold it but lose the ball when I try to turn', 'I keep the ball and find solutions most times', 'I thrive under pressure — I turn defenders inside out'],
      videoKey: 'dribbling_tight',
      lowAdvice: 'CAMs face intense pressing. Your protection of the ball under pressure comes from low centre of gravity and using your body as a shield. When you can\'t go forward, hold and recycle — don\'t force it.',
      highAdvice: 'Excellent in tight spaces. Work on the "double touch" — take a touch to one side to show the move, then take the ball back the other way instantly. This creates that split-second gap to accelerate.',
    },
    {
      id: 'finishing', text: 'How clinical are you at arriving late to score or finishing when you receive in the final third?',
      options: ['Finishing is a weakness — I miss too many', 'I score some but should score more', 'I\'m reasonably clinical when chances come', 'I take my chances — finishing is a strength'],
      videoKey: 'finishing',
      lowAdvice: 'As a CAM you need to score from distance and on late arrivals. Work on half-volleys and first-time strikes. Pick a spot before the ball arrives — the moment of indecision is when the chance goes.',
      highAdvice: 'Good finishing for your position. Work on variety — chips over rushing goalkeepers, side-foot placements into corners. Keepers can\'t prepare for both pace and placement.',
    },
    {
      id: '1v1_attacking', text: 'When you receive and face a defender 1v1, how often do you come out on top?',
      options: ['I get stopped — 1v1 isn\'t my strength', 'I beat defenders sometimes but often lose the ball', 'I beat defenders regularly', 'I\'m very hard to stop 1v1'],
      videoKey: '1v1_attacking',
      lowAdvice: 'CAM 1v1 is about disguise before the move. Use your eyes — look one way, go the other. A shoulder drop before your feint gives you a 0.5 second advantage.',
      highAdvice: 'Strong 1v1 ability. Work on "in-behind" dribbles — rather than always attacking the defender face-on, run at their outside shoulder to burst into space behind them. Defenders hate this more.',
    },
  ],

  W: [
    {
      id: '1v1_attacking', text: 'Your bread and butter — taking on defenders 1v1 down the wing. How often do you beat them?',
      options: ['Rarely — I get stopped most times', 'Sometimes — it depends on the defender', 'Often — I beat most defenders', 'Almost always — 1v1 is my strongest attribute'],
      videoKey: '1v1_attacking',
      lowAdvice: 'As a winger, beating defenders is your core skill. Start with 2 signature moves and master them completely before adding others. A Cruyff turn and a step-over at full pace will get you past 90% of defenders.',
      highAdvice: 'Excellent 1v1 ability. Now work on your "entry" into the duel — approach at speed but then decelerate to make the defender commit. The pause before the move is where defenders get beaten.',
    },
    {
      id: 'crossing', text: 'Once you\'ve beaten the defender or cut inside, how accurate is your final delivery?',
      options: ['Weak — my final ball lets me down badly', 'Inconsistent — sometimes good, sometimes off', 'Good — I deliver well most of the time', 'Excellent — my deliveries constantly create chances'],
      videoKey: 'crossing',
      lowAdvice: 'Final delivery is a winger\'s superpower and it\'s letting you down. Pick ONE crossing technique and drill it: the whipped cross with the inside of the foot across the goalkeeper. Aim for the far post — it opens everything.',
      highAdvice: 'Good delivery. Add the early cross to your toolkit — before the defender can recover. Also master the low cutback into the 6-yard box. These are the hardest crosses to defend.',
    },
    {
      id: 'dribbling_tight', text: 'In tight areas near the byline or corner flag, can you hold the ball under intense pressure?',
      options: ['I lose the ball quickly in tight areas', 'I can hold it briefly but struggle to create', 'I hold up well and usually find a solution', 'I love tight areas — I can turn any defender'],
      videoKey: 'dribbling_tight',
      lowAdvice: 'Tight space dribbling for wingers is about body position and balance. Keep the ball on the outside foot near the byline — it\'s harder to tackle. Use the La Croqueta to move it quickly to the other foot.',
      highAdvice: 'Great close control. Add the "fake cross" to freeze the defender, then cut back or dribble past. This tiny hesitation creates massive space.',
    },
    {
      id: 'finishing', text: 'When you cut inside onto your stronger foot, how often do you finish or create a shot on goal?',
      options: ['I miss a lot — finishing from here is a weakness', 'I hit the target sometimes', 'I score or force saves regularly from here', 'I\'m deadly cutting in — it\'s a strength'],
      videoKey: 'finishing',
      lowAdvice: 'The inverted winger shot is one of the most predictable but deadly moves in football. Work on your shot shape — a curled shot into the far corner from the edge of the box with your stronger foot is your money shot.',
      highAdvice: 'Dangerous when cutting inside. Work on your first-time shot — the moment you\'ve beaten the fullback and the ball comes in. Don\'t take a touch to set up; just hit it. One touch makes it nearly unsaveable.',
    },
    {
      id: 'off_ball_movement', text: 'Off the ball, how good is your movement — making runs in behind, finding space when others have the ball?',
      options: ['I stand and wait for the ball rather than move', 'I make some runs but don\'t always time them well', 'I make good runs and stretch defences', 'I constantly threaten in behind and create space'],
      videoKey: 'off_ball_movement',
      lowAdvice: 'Winger movement off the ball is underused. When your striker has the ball, make a diagonal run in behind — even if you don\'t get the pass, you pull the fullback and create space for your striker to turn.',
      highAdvice: 'Excellent off-ball movement. Work on the "dummy run" — making a run to pull the defender, then stopping and coming back to receive short. This creates the 1v1 situation you want.',
    },
    {
      id: 'sprint_speed', text: 'How does your pace and explosive sprint help you in behind defences?',
      options: ['Speed isn\'t my strength — I rely on skill', 'I\'m quick but often start my run too late', 'I use my pace effectively to get in behind', 'I\'m very fast and constantly threaten in behind'],
      videoKey: 'sprint_speed',
      lowAdvice: 'If pace isn\'t your weapon, technique must be. Work on your acceleration from a standing start — the first 5 metres is where wingers create the gap. Hip flexor mobility and explosive starts make a huge difference.',
      highAdvice: 'Great pace. Work on timing your runs to stay onside — can you ghost past the last defender\'s shoulder as the ball is played? Elite wingers use centimetres to stay onside on through balls.',
    },
  ],

  ST: [
    {
      id: 'finishing', text: 'How clinical are you in front of goal — do you take your chances?',
      options: ['I miss too many — finishing is a big weakness', 'I score some but waste clear-cut chances', 'I\'m fairly reliable when chances fall my way', 'Very clinical — I take almost every good chance'],
      videoKey: 'finishing',
      lowAdvice: 'Finishing is 90% decision and 10% technique. The decision — pick your spot before the ball arrives. The moment of doubt is the moment you miss. Work on 50 shots a day — low, high, left, right, header.',
      highAdvice: 'Clinical finishing is your greatest asset. Work on the "difficult chances" — half-volleys, volleys, first-time shots from awkward angles. These are what separate good from elite strikers.',
    },
    {
      id: 'off_ball_movement', text: 'How good is your movement — timed runs, losing your marker, making space for others?',
      options: ['I wait for the ball — my movement is static', 'I make some runs but often in the wrong direction', 'I make good runs and get into dangerous positions', 'My movement constantly creates problems for defenders'],
      videoKey: 'off_ball_movement',
      lowAdvice: 'A striker who doesn\'t move gives defenders an easy job. Work on the "check run" — go toward the ball to pull the defender, then spin in behind as they come. Also make diagonal runs across the back line, not just straight.',
      highAdvice: 'Excellent movement. Now work on timed runs for late arrivals into the box on crosses. These "late runs from deep" are almost impossible to track — study Firmino and Benzema on YouTube for examples.',
    },
    {
      id: 'aerial_duels', text: 'How dominant are you in the air — attacking crosses, flick-ons, winning headers at set pieces?',
      options: ['Heading is a weakness — I lose most', 'About 50/50 in the air', 'I win most aerial duels in the box', 'I\'m a constant aerial threat at set pieces and crosses'],
      videoKey: 'aerial_duels',
      lowAdvice: 'Striker heading needs to be attacking — power and placement over height. Time your run to arrive at the highest point. Aim for the corners of the goal — glancing headers are the hardest to save.',
      highAdvice: 'Excellent aerial presence. Work on "flick-ons" for your striker partner — redirecting long balls into dangerous zones. This disrupts defensive structures without needing you to score every header.',
    },
    {
      id: 'hold_up_play', text: 'Can you hold the ball up with your back to goal and bring teammates into play?',
      options: ['I lose the ball easily when facing away from goal', 'I hold it briefly but struggle to link play', 'I\'m fairly good at bringing others into play', 'I\'m a reliable target man — I bring everyone in'],
      videoKey: 'hold_up_play',
      lowAdvice: 'Hold-up play is about using your body. Get low, spread your arms (legally), and shield with your back — your body between defender and ball. First touch must go away from the defender, not into them.',
      highAdvice: 'Strong hold-up play. Add variety — sometimes turn instead of laying off. Reading when the defender expects the lay-off and spinning past them instead is devastating.',
    },
    {
      id: 'pressing', text: 'How effective is your pressing and work rate out of possession — do you disrupt defenders from the front?',
      options: ['I don\'t press much — I save energy for attacking', 'I press sometimes but often start too late', 'I press well and win the ball or force mistakes', 'My pressing is relentless — I force errors consistently'],
      videoKey: 'pressing',
      lowAdvice: 'Even if you don\'t win the ball yourself, good pressing forces defenders into mistakes and shortens the field for your team. Work on "press triggers" — when to press (keeper receives, back pass, defender with head down).',
      highAdvice: 'Elite pressing striker. Work on "press angles" — not just running at the defender, but cutting off their easiest pass option to force them into a harder decision. This is what Klopp\'s forwards do perfectly.',
    },
    {
      id: '1v1_attacking', text: 'When you\'re through on goal or in a 1v1 with a defender in the box, how composed are you?',
      options: ['I panic and often make the wrong choice', 'I get it right sometimes but not consistently', 'I usually make the right call in 1v1s', 'Very composed — I back myself every time'],
      videoKey: '1v1_attacking',
      lowAdvice: '1v1 composure for strikers is the hardest skill to train. Simulate it in training — have someone pass to you in behind with only the GK to beat. Repetition is the only cure for panic.',
      highAdvice: 'Excellent composure. Work on reading the goalkeeper\'s movement — are they coming? Are they set? A small chip or placement at the near post works when they commit too early.',
    },
  ],
}

// ─── Score & report building ──────────────────────────────────────────────────

function getPriority(score: number): 'critical' | 'high' | 'medium' {
  if (score < 40) return 'critical'
  if (score < 62) return 'high'
  return 'medium'
}

function buildReport(
  answers: Record<string, number>,
  questions: Question[],
  matchStats: { avgPassAccuracy: number; matches: number },
  position: string,
): TrainingReport {
  const scores = [20, 42, 65, 88]
  const areas: TrainingArea[] = []

  questions.forEach(q => {
    const idx = answers[q.id] ?? 2
    const rawScore = scores[idx]
    const score = q.id === 'passing' && matchStats.avgPassAccuracy > 0
      ? Math.round((rawScore + matchStats.avgPassAccuracy) / 2)
      : rawScore

    if (score < 65) {
      areas.push({
        skill: q.id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        score,
        priority: getPriority(score),
        advice: score < 42 ? q.lowAdvice : q.highAdvice,
        drills: VIDEOS[q.videoKey] ?? [],
      })
    }
  })

  const priorityOrder = { critical: 0, high: 1, medium: 2 }
  areas.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  const top3 = areas.slice(0, 3)

  // Map a skill label back to the video key so each day gets relevant videos
  function videosForSkill(skill: string): { title: string; url: string }[] {
    const s = skill.toLowerCase()
    if (s.includes('1v1 defend')) return VIDEOS['1v1_defending']
    if (s.includes('1v1 attack') || s.includes('dribbling moves')) return VIDEOS['1v1_attacking']
    if (s.includes('aerial') || s.includes('header')) return VIDEOS['aerial_duels']
    if (s.includes('dribbling in tight') || s.includes('close control')) return VIDEOS['dribbling_tight']
    if (s.includes('crossing') || s.includes('delivery')) return VIDEOS['crossing']
    if (s.includes('finish') || s.includes('composure')) return VIDEOS['finishing']
    if (s.includes('hold') || s.includes('link')) return VIDEOS['hold_up_play']
    if (s.includes('press')) return VIDEOS['pressing']
    if (s.includes('pass') || s.includes('combination') || s.includes('vision')) return VIDEOS['passing']
    if (s.includes('read') || s.includes('positioning') || s.includes('awareness')) return VIDEOS['reading_game']
    if (s.includes('distribution') || s.includes('gk')) return VIDEOS['distribution_gk']
    if (s.includes('shot stop')) return VIDEOS['gk_shot_stopping']
    if (s.includes('screening') || s.includes('cdm') || s.includes('intercept')) return VIDEOS['cdm_screening']
    if (s.includes('recover') || s.includes('transition')) return VIDEOS['recovery_runs']
    if (s.includes('off the ball') || s.includes('movement') || s.includes('run')) return VIDEOS['off_ball_movement']
    if (s.includes('speed') || s.includes('sprint') || s.includes('fitness')) return VIDEOS['sprint_speed']
    return VIDEOS['passing']
  }

  const dayVideos = (focus: string) => videosForSkill(focus).slice(0, 2)

  const weeklyPlan: WeekDay[] = [
    {
      day: 'Monday',
      focus: top3[0]?.skill ?? 'Technical Ball Work',
      duration: '45 min',
      videos: top3[0] ? top3[0].drills.slice(0, 2) : dayVideos('technical'),
    },
    {
      day: 'Tuesday',
      focus: 'Sprint Speed & Explosive Fitness',
      duration: '30 min',
      videos: VIDEOS['sprint_speed'].slice(0, 2),
    },
    {
      day: 'Wednesday',
      focus: top3[1]?.skill ?? 'Combination Play & Passing',
      duration: '45 min',
      videos: top3[1] ? top3[1].drills.slice(0, 2) : VIDEOS['passing'].slice(0, 2),
    },
    {
      day: 'Thursday',
      focus: 'Rest / Light Juggling & Weak Foot',
      duration: '20 min',
      videos: [
        { title: 'Weak Foot Training Routine', url: ytSearch('weak foot training routine soccer tutorial') },
        { title: 'Juggling & First Touch Drills', url: ytSearch('juggling first touch drills soccer tutorial') },
      ],
    },
    {
      day: 'Friday',
      focus: top3[2]?.skill ?? 'Close Control & 1v1',
      duration: '40 min',
      videos: top3[2] ? top3[2].drills.slice(0, 2) : VIDEOS['dribbling_tight'].slice(0, 2),
    },
    {
      day: 'Saturday',
      focus: 'Match / Full Team Training',
      duration: 'Full session',
      videos: [
        { title: 'Pre-Match Mental Preparation', url: ytSearch('pre match mental preparation soccer athlete') },
        { title: 'Match Day Warm-Up Routine', url: ytSearch('match day warm up routine soccer player') },
      ],
    },
    {
      day: 'Sunday',
      focus: 'Recovery + Watch Your Own Footage',
      duration: '20 min',
      videos: [
        { title: 'How to Analyse Your Own Football', url: ytSearch('how to analyse your own football match footage') },
        { title: 'Active Recovery Routine for Footballers', url: ytSearch('active recovery routine footballers soccer') },
      ],
    },
  ]

  const summary = areas.length === 0
    ? `Impressive across the board for a ${position}! You self-assessed very highly. The biggest jump now comes from mastering the fine details — consistency under fatigue, and adding variety to what's already working.`
    : `As a ${position}, your biggest development areas right now are ${areas.slice(0, 2).map(a => a.skill).join(' and ')}. ${areas[0].priority === 'critical' ? `${areas[0].skill} is urgently holding your game back.` : `Targeted daily work on these will show results within 4–6 weeks.`}`

  return { summary, areas: areas.slice(0, 5), weeklyPlan }
}

// ─── Personalized Q&A engine ──────────────────────────────────────────────────

function generateAIAnswer(question: string, position: string, assessmentScores: Record<string, number>): string {
  const q = question.toLowerCase()
  const pos = getPositionGroup(position)

  // Pull known weak areas from their assessment to reference personally
  const scores = [20, 42, 65, 88]
  const weakAreas = Object.entries(assessmentScores)
    .map(([id, idx]) => ({ id, score: scores[idx] ?? 65 }))
    .filter(a => a.score < 62)
    .sort((a, b) => a.score - b.score)
  const biggestWeak = weakAreas[0]?.id ?? null

  // ── Weak foot ──
  if (q.includes('weak foot') || q.includes('weaker foot') || q.includes('both feet')) {
    const isMentionedLeft = q.includes('left')
    const isMentionedRight = q.includes('right')
    const side = isMentionedLeft ? 'left' : isMentionedRight ? 'right' : 'weaker'
    return `So you want to develop your ${side} foot — honestly one of the highest-ROI things you can work on as a ${position}. Here's the thing though: most players try to do too much too fast with their weak foot and get frustrated.\n\nStart stupidly simple. For the first two weeks, just pass against a wall — 100 touches every session, ${side} foot only. No crossing, no shooting yet, just passes. Your touch needs to feel normal before you add complexity.\n\nWeek 3-4: add receiving and setting up. When you trap the ball with your ${side} foot, it should stick. Week 5-6: start shooting. Low driven shots inside the box, aiming at corners.\n\nThe goal after 6-8 weeks isn't to be as good with it as your strong foot — that takes years. You want it to be usable under mild pressure. That alone makes you twice as unpredictable as a ${position} because defenders can't just force you one way.`
  }

  // ── Speed / pace ──
  if (q.includes('speed') || q.includes('faster') || q.includes('pace') || (q.includes('slow') && !q.includes('slow down'))) {
    if (pos === 'W' || pos === 'ST') {
      return `Okay so for a ${position}, pace is basically a superpower — and the good news is you can genuinely improve it.\n\nThe biggest misconception is that speed training means just running fast. It doesn't. The gains come from three things: first step quickness, stride mechanics, and hip flexor strength.\n\nFor first step: do 10m explosive starts from different positions — standing, crouching, mid-stride. Do 6 sets every Tuesday and Thursday. Within 3-4 weeks your first two steps will be noticeably quicker.\n\nFor stride mechanics: most players overstride, which actually slows them down. Your foot should land under your hips, not in front of them. Film yourself running from the side — you'll see it immediately.\n\nFor hip flexors: tight hip flexors are the #1 speed killer and nobody talks about it. 10 minutes of hip flexor stretching daily (lunges, pigeon pose) will free up your stride.\n\nRealistic expectation: 0.2-0.4 seconds off your 30m sprint in 6-8 weeks of proper training. That's a defender who used to catch you now eating your dust.`
    }
    return `Alright, speed for a ${position} — let me break down what actually matters here.\n\nFor your position it's less about top speed and more about explosive acceleration over short distances. The ability to burst 5-10m faster than the person next to you is what wins you duels, gets you to loose balls first, and creates separation.\n\nHere's the routine: twice a week, do 6 rounds of 10m explosive sprints. Start from standing, start from a jog, start from a sideways shuffle. The variety trains your body to accelerate from match-realistic positions, not just a standing start.\n\nAlso work on change-of-direction speed — plant and drive drills, 5-5-5m shuttles. A ${position} changes direction way more than they sprint in a straight line.\n\nAnd honestly? Losing unnecessary body weight (if applicable) and improving your sleep/recovery will show up as speed gains faster than any sprint drill.`
  }

  // ── Confidence / mental ──
  if (q.includes('confidence') || q.includes('nervous') || q.includes('mental') || q.includes('anxiety') || q.includes('scared') || q.includes('afraid')) {
    const specificSituation = q.includes('1v1') ? '1v1 situations' : q.includes('shoot') || q.includes('finish') ? 'shooting' : q.includes('big game') || q.includes('important') ? 'big games' : 'high-pressure moments'
    return `You mentioned ${specificSituation} — and honestly this is something almost every player deals with, they just don't admit it.\n\nHere's the truth about confidence: it's not something you think your way into. It comes entirely from repetition. The reason you feel nervous in ${specificSituation} is because your brain hasn't done it enough times to file it as "normal." It still sees it as a threat.\n\nThe fix is deliberate exposure. Whatever situation makes you nervous, you need to simulate it in training until it's boring. Nervous about 1v1s? Do 30 a session. Nervous about finishing? Shoot 50 balls a day from the exact range and angle that scares you.\n\nAlso — before games, most players try to calm down. The research actually says you should reframe the nerves as excitement. "I'm excited" and "I'm nervous" feel physically identical. One works for you, one against you. Try saying "I'm excited" out loud before kickoff. Sounds weird, genuinely works.\n\nLast thing: don't hide from hard moments in training. Volunteer for the hard drill. Take the penalty with consequences. Make training harder than the match.`
  }

  // ── Fitness / stamina ──
  if (q.includes('fitness') || q.includes('stamina') || q.includes('tired') || q.includes('endurance') || q.includes('gas') || q.includes('lung')) {
    const lateGame = q.includes('second half') || q.includes('end of game') || q.includes('last') || q.includes('tired late')
    return `${lateGame ? 'Fading in the second half is a really specific problem and a fixable one.' : `Match fitness for a ${position} — let me be real with you about this.`}\n\n${lateGame ? 'The reason players fade late isn\'t usually lack of fitness, it\'s lack of match-specific conditioning. You need to train at the intensity of the last 20 minutes of a game, not a comfortable jog.' : 'There\'s a massive difference between being gym-fit and being football-fit. You can run a 5k fine but still be sucking wind in the 75th minute because the demands are completely different.'}\n\nThe best drill for game fitness as a ${position}: interval runs that mirror match intensity. 6 rounds of 200m at 90% effort, 90 seconds rest between each. Twice a week, every week. This is what coaches call "threshold training" and it directly translates to lasting longer in a match.\n\nAdd to that: small-sided games in training are actually better fitness work than straight running. 5v5 or 6v6 for 20-25 minute blocks will improve your conditioning faster than laps because you're working at match pace mentally and physically.\n\nMost players see real improvement in 3-4 weeks. But the unsexy truth is recovery matters just as much — 8 hours sleep, proper food after training, hydration. A player who trains at 70% intensity but recovers properly will outperform someone training at 100% and sleeping 5 hours.`
  }

  // ── Dribbling / skills ──
  if (q.includes('dribbl') || q.includes('skill move') || q.includes('trick') || (q.includes('beat') && q.includes('defender'))) {
    const wantSpecificMove = q.includes('step') || q.includes('cruyff') || q.includes('elastico') || q.includes('roulette') || q.includes('drag') || q.includes('feint')
    if (wantSpecificMove) {
      if (q.includes('stepover') || q.includes('step over')) {
        return `The step-over — one of the most effective moves in football when it's done right. The reason most players' step-overs don't work is they do it too slow. The step-over only beats defenders at speed.\n\nHere's how to make it devastating: the step should go OVER the ball (not around it) and your plant foot lands wide. Then the exit touch goes the opposite direction fast. Practice this at full speed over cones before trying it on a defender.\n\nThe key that nobody tells you: sell it with your EYES first. Look one way, go the other. A step-over with matching eye contact is almost undefendable. Without it, a good defender reads the move before your foot even starts.`
      }
      if (q.includes('cruyff')) {
        return `The Cruyff turn is underrated — especially for a ${position} because it works when you're facing the byline under pressure, which happens constantly.\n\nThe mechanics: fake like you're crossing or shooting, drag the ball back with the inside of your foot behind your standing leg, and turn 180 degrees in one motion. The key is the fake has to be convincing — your body weight and arm position should sell the cross.\n\nWhere it works best for a ${position}: when a defender has overcommitted to blocking the cross and you're near the byline. One Cruyff and they're gone. Practice it against a wall at full speed before adding a defender.`
      }
    }
    return `Alright, dribbling — I'll give you the honest version of what actually works.\n\nMost tutorials tell you to learn 15 moves. That's wrong. The players who beat defenders consistently have 2, maybe 3 moves they own completely — and they can do them at full pace, under pressure, on both sides.\n\nFor a ${position}, I'd suggest: **one speed move** (touch-and-sprint past the defender's shoulder — simple, devastating), **one feint** (body drop or shoulder drop before changing direction), and **one tight-space move** (la croqueta or drag-back for when you're pressed).\n\nHere's the training method that actually works: set up 2 cones 2 metres apart as a defender. Do your move at walk speed first. Then jog. Then full sprint. 20 minutes a day on ONE move. After 3 weeks it will feel automatic under pressure.\n\n${biggestWeak === '1v1_attacking' ? 'Given what you told me in the assessment, 1v1 attacking is a clear gap for you right now — so treat this like it\'s the most important 20 minutes of your training day.' : 'The move that fits your game as a ' + position + ' best depends on where you use it most on the pitch.'}`
  }

  // ── Passing / vision ──
  if ((q.includes('pass') || q.includes('vision') || q.includes('combination') || q.includes('through ball')) && !q.includes('off the ball')) {
    const throughBall = q.includes('through ball') || q.includes('killer pass')
    if (throughBall) {
      return `Through balls — the most satisfying pass in football and also the hardest to get right consistently.\n\nThe issue with most players' through balls is timing — they play it to where the runner IS, not where they'll BE. You have to project 1.5-2 seconds into the future. Watch the runner's stride pattern to judge their speed, then aim for the space.\n\nThe other thing: weight. A through ball too hard and the keeper gets it. Too soft and the defender gets back. The perfect through ball has just enough pace that the forward can run onto it without breaking stride.\n\nHow to train it: find a wall with a gap or cone gates. Stand 20m away and chip the ball through the gap while walking — it forces you to time and weight the ball precisely. When it feels easy, add movement to replicate match conditions.`
    }
    return `Passing and vision as a ${position} — here's what separates good from great.\n\nEverybody focuses on the pass itself. The real unlock is what happens BEFORE you receive the ball. Scan over both shoulders every 2-3 seconds. By the time the ball arrives, you should already know your first and second options. You should never be making the decision after you've touched it — that's too late.\n\nPractical drill: in every training session, call out what you see out loud before you touch the ball. "Man on left, space right" or "free, third man available." Saying it out loud forces the scan. Do this for 2 weeks and it becomes instinct.\n\n${biggestWeak === 'passing' ? 'This came up as a weak area in your assessment — the good news is it\'s one of the fastest things to improve because it\'s more habit than skill. ' : ''}For combination play specifically: learn the third-man concept. You pass to player A, A passes to B, and you burst into space to receive from B. This breaks any mid-block press because the movement happens before the defence can react.`
  }

  // ── Shooting / finishing ──
  if (q.includes('shoot') || q.includes('finish') || (q.includes('goal') && !q.includes('goal setting')) || q.includes('clinical') || q.includes('miss')) {
    const missingOpen = q.includes('open goal') || q.includes('easy') || q.includes('should score') || q.includes('miss a lot')
    return `${missingOpen ? 'Missing chances you feel you should score — that one stings. Let me tell you exactly why it happens.' : 'Finishing is the skill with the biggest gap between training and match performance. Here\'s why.'}\n\n${missingOpen ? 'Usually it\'s one of two things: rushing (you try to hit it before you\'re ready because you\'re excited) or overthinking (you suddenly become too aware of the pressure and freeze). Both have the same fix.' : 'The decision on where you\'re shooting should be made BEFORE the ball reaches you — based on where the keeper is and where the defender is coming from. The moment you pause to decide after touching the ball, you\'ve given them time to recover.'}\n\nHere's what actually changes conversion rates: 50 shots per training session, split like this — 20 placed (pick a corner, commit before touching), 20 driven (full power, inside of the box), 10 first-time (someone feeds you, one touch finish). Do this every session for 4 weeks.\n\nFor a ${position}, also work on: finishing under fatigue. Most chances come when you're tired. Sprint 30m, receive, finish. Repeat 10 times. When you can put it in the net while your lungs are burning, the match version feels easy.\n\n${biggestWeak === 'finishing' ? 'This was your lowest-scoring area — but honestly finishing is the one that responds fastest to repetition. You\'ll notice results in 2-3 weeks of proper volume.' : ''}`
  }

  // ── Defending / tackling ──
  if ((q.includes('defend') || q.includes('tackling') || q.includes('tackle') || q.includes('winning the ball') || q.includes('press')) && !q.includes('pressing')) {
    if (pos === 'W' || pos === 'ST') {
      return `Defending as a ${position} — different animal than defending as a CB or CDM, so here's what's actually relevant for you.\n\nYour main defensive job is pressing and winning the ball high up the pitch. The key is pressing TRIGGERS, not just pressing randomly. The trigger is when the defender has their back to you, when they receive a back pass, or when they take a heavy touch. That's your moment to go — not when they're comfortable on the ball.\n\nThe angle of your press matters massively. Don't run straight at them — approach from a slight angle that cuts off the easy pass to the centre. Force them to play backwards or out wide. This is called "pressing with purpose" and it's what the best pressing forwards like Klopp's players do.\n\nWhen you don't win it: get goal-side immediately. Your second job is to prevent the quick counter — don't ball-watch when you lose it, track your runner.`
    }
    return `Defending — let me get specific about what's going wrong and what fixes it.\n\nThe most common mistake for a ${position}: diving in. Going to ground or lunging when the attacker has the ball still at their feet is the defender's biggest error. You're taking yourself out of the game.\n\nProper 1v1 defending: stance sideways-on (not face-on), weight on the balls of your feet, one arm out for balance. Your job is to DELAY and CHANNEL — force them where you want them, not where they want to go. Show them your weak side or towards cover.\n\nThe tackle window: it opens when they take a heavy touch, look down at the ball, or turn their back. That's it. Outside of those moments, stay patient. A good attacker wants you to go early — they'll fake to draw you out. Don't give it to them.\n\n${biggestWeak === '1v1_defending' ? 'Your assessment showed this is your biggest area — so make 1v1 defending drills a priority every single session. 20 minutes, both attacking and defending, against a teammate.' : 'Consistency in your defensive shape is what you\'re building. It takes about 4-6 weeks of deliberate focus to make it instinctive.'}`
  }

  // ── Pressing ──
  if (q.includes('pressing') || q.includes('press the ball') || q.includes('high press') || q.includes('counter press')) {
    return `Pressing is one of the most underrated skills in youth football — most players just run at the ball, which is almost useless.\n\nEffective pressing for a ${position} comes down to three things: triggers, angles, and intensity.\n\n**Triggers** — don't press constantly, press at specific moments. Back pass to keeper, defender with head down, defender on weak foot, first touch that goes away from them. Outside of triggers, hold your shape and cut off the pass instead.\n\n**Angles** — never press straight at the ball carrier. Approach from the angle that cuts off the pass they want to make. Make them play backwards or into a worse position.\n\n**Intensity** — when you press, press at 100% or not at all. Half-hearted pressing telegraphs your intention without applying real pressure. Sprint, commit, be aggressive.\n\nIn training: ask a coach or teammate to signal a trigger word. The moment they say it, you sprint to press with the right angle. Do this until the trigger creates an instant automatic response. That's when pressing becomes genuinely effective.`
  }

  // ── Positioning ──
  if (q.includes('position') || q.includes('where to stand') || q.includes('where do i') || q.includes('movement') || (q.includes('space') && !q.includes('tight space'))) {
    const posMap: Record<string, string> = {
      W: `As a winger, your positioning is constantly changing based on where the ball is. Ball on your side: stretch wide, hug the touchline to hold the fullback. Ball on far side: drift inside toward the 10 space — this pulls their fullback centrally and creates space behind them for when we switch play.\n\nWhen you don't have the ball, never stand in a line with the centre-backs. You're too easy to mark. Find the "half-space" — the channel between the wide player and the centre. That's where the most dangerous balls get played.\n\nIn terms of recovery positioning when you lose it: first check where their fullback is. If they're high, you need to track them back. If they're sitting deep, hold your press position.`,
      ST: `As a striker, your default positioning principle is: never be where both centre-backs can see you without turning their head.\n\nConstantly move across the defensive line — left to right, right to left. Small 2-3m movements, not big runs. These force CB communication, create gaps, and drain their concentration over 90 minutes. By the 60th minute, the CB who's been tracking you is mentally tired.\n\nBefore the ball is played to you: position yourself so one CB is between you and the ball. This means when you spin, you have a half-second advantage before they can react.\n\nFor set pieces: don't go to the far post every time. Mix it up — near post run, blocking run, edge of the box for second ball. Predictable strikers are easy to mark.`,
      CB: `As a CB, positioning is your main job — it determines whether you even have to tackle or whether danger never develops.\n\nThe rule: always goal-side of your runner, always able to see ball AND attacker in your peripheral vision. The moment one of those is lost, you've given up an advantage.\n\nOn a high defensive line: trust your read. Step up aggressively when you see the through ball is on — don't wait for it to be played. The offside trap works because CBs move together early.\n\nFor crosses: position yourself at the far post (not the near) as a default — you can always come forward to claim it, but you can't recover to the far post if you're at the near.`,
      CDM: `CDM positioning is all about being the "plug" — filling spaces before the attack can use them.\n\nYour starting position should always be in the shadow of the most dangerous runner. Not the ball carrier — the runner they want to pass to. If you're there before the pass, you intercept it. If you're there after, it's too late.\n\nWhen your fullback goes forward: shift to cover. When your CB goes to press: drop in to cover the gap. You're the chess piece that compensates for everyone else moving.\n\nKey rule: if you can see the ball and all dangerous runners in your zone at once, your positioning is wrong — you're too deep and too central. The effective CDM is always slightly uncomfortable, slightly between positions, forcing attackers to make harder choices.`,
    }
    return posMap[pos] ?? `Positioning for a ${position} comes down to: can you see the ball and your primary opponent at the same time? If not, adjust until you can. Every 3 seconds, check both. Movement between checks — 2-3 steps to adjust your angle — keeps defenders from getting comfortable tracking you.`
  }

  // ── Trials / scouting / impressing ──
  if (q.includes('trial') || q.includes('scout') || q.includes('impress') || q.includes('tryout') || q.includes('coach notice') || q.includes('scholarship')) {
    return `Trials and getting noticed — okay this is something I can actually help you think through because most players approach this completely wrong.\n\nThe mistake: trying to do too much. Players go into trials wanting to show every skill they have, and they try a no-look pass when a simple 5-yard ball was the right call. Coaches watching trials are grading decision-making above almost everything else.\n\nWhat actually gets you noticed as a ${position}:\n\n1. **Control + pass at pace** — receive and release quickly and accurately. Looks simple, is actually rare.\n2. **Body language off the ball** — coaches are watching you when you DON'T have the ball. Are you scanning? Are you making runs? Are you communicating? This separates players immediately.\n3. **Win your position-specific duel** — whatever your job is, do it well. As a ${position}, that means ${pos === 'W' ? 'winning 1v1s and making crosses count' : pos === 'ST' ? 'holding the ball up and making runs in behind' : pos === 'CB' ? 'winning headers and not getting beaten 1v1' : 'covering space and keeping possession moving'}.\n4. **React to mistakes quickly** — you'll make errors. The response matters more than the error. Sprint back, get involved, show no drop in effort.\n\nBefore the trial: don't try to learn anything new. Just sharpen what you already do. You want to play on autopilot so you can focus on reading the game.`
  }

  // ── Physical strength ──
  if (q.includes('strength') || q.includes('stronger') || q.includes('physical') || q.includes('gym') || q.includes('weight') || q.includes('muscle') || q.includes('knock off')) {
    return `Physical strength for a ${position} — and I'll be specific because "go to the gym" is useless advice.\n\nThe movements that translate directly to football: **single-leg squat** (balance, landing strength, dueling power), **hip thrusters/bridges** (acceleration — every sprint starts from your glutes), **rotational core work** (striking, shielding, heading — anything that involves twisting).\n\nYou don't need a gym for any of these. Bodyweight versions: Bulgarian split squats, glute bridges with a pause, and Russian twists with a water bottle for resistance. 3 sets of 10-12 each, 3 times a week.\n\nFor being stronger on the ball specifically — it's less about muscle and more about technique. Lower your centre of gravity when shielding (bend your knees), spread your arms for balance (legally), and lean into contact rather than away from it. A technically correct shield position beats a bigger player every time.\n\nTimeline: 6 weeks of consistent bodyweight training and you'll notice real difference in duels. Combine it with eating enough protein (150g+ daily if you're training hard) and the results compound faster.`
  }

  // ── Video analysis / watching footage ──
  if (q.includes('video') || q.includes('footage') || q.includes('film') || q.includes('watch') || q.includes('analys')) {
    return `Self-analysis through video is genuinely one of the fastest ways to improve — most players never do it because it's uncomfortable to watch yourself make mistakes. That discomfort is exactly why it works.\n\nHere's the process that makes it productive rather than just painful:\n\n**First watch: full speed, no pausing.** Just get a general feel for how you're moving. Are you looking up? Are you in the right positions?\n\n**Second watch: pick ONE thing to focus on.** Not everything. One thing — like your scanning habits, or where you position yourself before receiving. Pause every time that moment occurs.\n\nAsk yourself: "What should I have done 3 seconds BEFORE this problem happened?" Almost every mistake has a root cause 3 seconds earlier. Wrong body position, didn't scan, wrong starting position. Fix the root, not the symptom.\n\nFor a ${position} specifically, watch yourself in your position-specific moments: ${pos === 'W' ? '1v1 situations against the fullback — what set up your success and what set up your failures?' : pos === 'ST' ? 'your movement before receiving — are you making life hard for the CBs?' : pos === 'CB' ? 'your positioning before the ball is played into the box' : 'your positioning relative to the ball and runners simultaneously'}.\n\nFinish by watching a professional ${position} play the same situations. Not to copy them move-for-move, but to understand the principle they're using.`
  }

  // ── Getting past defenders ──
  if ((q.includes('get past') || q.includes('beat a') || q.includes('get by') || q.includes('bypass')) && q.includes('defender')) {
    return `Beating defenders consistently isn't about having the best skill moves — it's about making the right decisions at the right moments.\n\nThe biggest factor most players ignore: **approach speed**. If you receive the ball and immediately try to beat them, they're set and ready. Approach at pace, then pause for just 0.5 seconds — this forces them to commit. The moment they shift their weight, that's your direction.\n\nFor a ${position}, the two most effective ways to beat a defender:\n\n**Speed dribble** — take a touch in behind their outside shoulder and sprint. No fancy move, just putting the ball into the space behind them and outrunning them to it. Works when they're square-on and flat-footed.\n\n**Double move** — fake one way (body, shoulders, eyes), pause, go the other. The pause is everything. Without the pause, it's just movement and defenders read movement. The pause makes them react, and reaction always loses to action.\n\nThe mental side: commit to your move. The players who get the ball and haven't decided yet are the easiest to defend. Decide on your move when the ball is in the air coming to you, then execute with zero hesitation.`
  }

  // ── Crossing ──
  if (q.includes('cross') || q.includes('deliver') || (q.includes('ball into') && q.includes('box'))) {
    return `Crossing — and I'll be real, this is one of the most neglected skills in training because players assume you just... kick it and hope.\n\nThe decision about what type of cross to play should be made before you get to the byline. Three main options: **whipped cross** (inside of foot across the face of goal — most dangerous, aimed between keeper and defenders), **low driven cutback** (when striker has made a run beyond the far post), **early cross** (before the defence sets — when you've got space and the striker is already moving).\n\nFor pure crossing technique: your plant foot should point at your target, not at the ball. Most players plant sideways and wonder why the ball goes the wrong way. Lock your ankle and follow through across your body for pace and curl.\n\nThe biggest upgrade for any ${position}: vary your crossing. If you always cross from the same spot with the same technique, the keeper reads it every time. Early ball, then late ball, then cutback — keep them guessing.\n\nPractical drill: set a cone at the near post and far post. Hit 20 crosses at each with your natural foot, then switch. Track how many land within 2m of the cone. That's your accuracy baseline. Improve it every week.`
  }

  // ── Recovery / transition ──
  if (q.includes('recover') || q.includes('get back') || q.includes('transition') || (q.includes('lose') && q.includes('ball') && q.includes('back'))) {
    return `Transition — specifically the moment you lose the ball and need to recover — is where games are won and lost, and most players are half a second too slow.\n\nThe reason: they watch the ball instead of immediately sprinting to their recovery position. The second the ball leaves your feet in a bad situation, your brain needs to already be calculating where to be, not watching what happens.\n\nAs a ${position}, your recovery priority: get goal-side of your direct runner first. Not the ball, not the attacker on the ball — your runner. Be between them and your goal before anything else.\n\nHow to train this: in every 5v5 or rondo drill, set a rule — every time your team loses the ball, you have 3 seconds to get to a designated "shadow zone" (your recovery position). If you don't make it in time, your team concedes a point. This trains the sprint instinct under match pressure.\n\nThe mental habit: every time you play a risky pass or dribble, have a plan for if it doesn't work. Know your recovery position before you try the move. Elite players aren't surprised when things go wrong — they're already moving to fix it.`
  }

  // ── Catch-all: extract most likely topic and give specific response ──
  const keywords = q.split(' ').filter(w => w.length > 4)
  const keyTopic = keywords.find(w =>
    ['control', 'touch', 'balance', 'communication', 'leadership', 'set piece', 'corner', 'free kick', 'penalty', 'nutrition', 'sleep', 'recovery', 'warm up', 'injury'].some(t => w.includes(t.split(' ')[0]))
  )

  if (q.includes('first touch') || q.includes('control') || q.includes('trap')) {
    return `First touch — the one skill that makes every other skill easier. Good first touch gives you time. Bad first touch puts you under pressure before you've even started.\n\nFor a ${position}, your first touch should always serve a purpose. It's not just stopping the ball — it's setting up your next action. If you're receiving under pressure, your touch goes away from the defender. If you're in space, your touch sets you up to attack or pass in one motion.\n\nThe drill that works fastest: passing against a wall, but receive with a directional first touch every time. Left, right, forward, in behind — vary it. Never trap the ball dead. After 2 weeks of 20 minutes daily, your touch under pressure will feel completely different.\n\nSoft surface of the foot, slightly raised off the ground, cushion the ball as it arrives — then redirect. The softer and more purposeful the touch, the more time you create.`
  }

  if (q.includes('free kick') || q.includes('set piece') || q.includes('corner') || q.includes('dead ball')) {
    return `Set pieces as a ${position} — massive source of goals and assists at youth level because most teams barely practice them.\n\nFor free kicks: the three options defenders can't prep for simultaneously are — driven low ball near post, chipped ball far post, squared ball for late runner. In a wall, defenders are focused on the ball, not the runners. A late third-man run into the far post scores goals literally every week at every level.\n\nFor corners: as a ${position}, your job is usually either delivery or being a runner. If you're delivering: aim for the zone between the 6-yard box and the penalty spot (where it's hardest for keepers to claim). If you're running: the most effective corner run is a "blocking run" — you run toward the near post, pull a defender, and let a teammate arrive free at the far post.\n\nPractice corners and free kicks 15 minutes every session. Teams that drill set pieces outperform teams that don't almost every time because goals from set pieces don't require any in-play creativity.`
  }

  if (q.includes('sleep') || q.includes('recover') || q.includes('nutrition') || q.includes('eat') || q.includes('diet') || q.includes('protein')) {
    return `Recovery and nutrition — underrated by 99% of youth players and it's directly affecting your performance and development.\n\nSleep is your #1 performance tool. More than any drill, more than any gym session. During sleep, your body consolidates motor patterns (the skills you practiced become permanent), releases growth hormone, and repairs muscle. 8 hours minimum. 9 is better for players your age. Even one night of 5-6 hours will measurably hurt your sprint speed, decision-making, and mood the next day.\n\nFor nutrition: you don't need anything fancy. Three things that actually matter — (1) eat enough total calories to fuel your training (most active players undereat and wonder why they're tired), (2) get 1.6-2g of protein per kg of bodyweight daily for muscle repair and development, (3) have a meal with carbs and protein within 45 minutes of finishing training — this is the recovery window.\n\nHydration: you lose about 1-1.5L of water per hour of training. Most players are chronically slightly dehydrated during sessions and don't know it. Drink 500ml an hour before training, sip during, and keep drinking after. Even mild dehydration (2% of body weight) drops sprint performance noticeably.`
  }

  // True fallback — still position-specific and actionable
  return `Right, so based on what you're asking — and thinking about it from the perspective of a ${position} at your stage — here's what I think matters most.\n\nThe question you're asking suggests you're already thinking about the right things. The players who improve fastest aren't the most talented, they're the ones who identify the right problems to solve and stay obsessively consistent on them.\n\nFor a ${position}, the areas with the highest return on training time right now are usually: 1v1 ability in your position-specific duels, passing quality under pressure, and reading the game before the ball arrives. ${biggestWeak ? `Your assessment flagged ${biggestWeak.replace(/_/g, ' ')} as your biggest gap — that's probably the best place to focus if you want the fastest improvement.` : 'Start with the skill that costs you the most in matches and work backwards from there.'}\n\nCan you get more specific about what you're trying to solve? Like — is this something that keeps happening in matches, or a specific scenario you want to get better at? The more specific you are, the more specific I can be.`
}

// ─── Thinking indicator ───────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full mt-0.5 bg-purple-600/20">
        <Bot className="h-3.5 w-3.5 text-purple-400" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-slate-800/60 px-4 py-3 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce [animation-delay:160ms]" />
        <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce [animation-delay:320ms]" />
      </div>
    </div>
  )
}

// ─── Components ───────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: 'critical' | 'high' | 'medium' }) {
  const map = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    high: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    medium: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${map[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
    </span>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color = score < 40 ? 'bg-red-500' : score < 62 ? 'bg-yellow-500' : 'bg-emerald-500'
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1.5 rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-400 w-7">{score}</span>
    </div>
  )
}

function WeekDayRow({ day, focus, duration, videos, isRest, isMatch }: {
  day: string; focus: string; duration: string
  videos: { title: string; url: string }[]
  isRest?: boolean; isMatch?: boolean
}) {
  const [open, setOpen] = useState(false)
  const dotColor = isRest ? 'bg-slate-600' : isMatch ? 'bg-emerald-500' : 'bg-purple-500'

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/40 transition-colors text-left"
      >
        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dotColor}`} />
        <p className="text-xs font-bold text-slate-400 w-20 flex-shrink-0">{day}</p>
        <p className="text-sm text-slate-200 flex-1">{focus}</p>
        <span className="text-xs text-slate-500 flex-shrink-0 mr-2">{duration}</span>
        {!isRest && <ChevronRight className={`h-3.5 w-3.5 text-slate-600 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />}
      </button>

      {open && videos.length > 0 && (
        <div className="border-t border-slate-800/60 px-4 pb-3 pt-2 space-y-2 bg-slate-900/40">
          {videos.map(v => (
            <a
              key={v.url}
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-800/30 px-3 py-2 hover:border-purple-600/40 hover:bg-purple-600/10 transition-all group"
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-red-600/20">
                <svg className="h-3 w-3 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </div>
              <p className="text-xs text-slate-300 group-hover:text-white flex-1 truncate">{v.title}</p>
              <ExternalLink className="h-3 w-3 text-slate-600 group-hover:text-purple-400 flex-shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function ReportCard({ report }: { report: TrainingReport }) {
  const [openArea, setOpenArea] = useState<number | null>(0)

  return (
    <div className="space-y-4 w-full max-w-2xl">
      <div className="rounded-xl border border-purple-600/30 bg-purple-600/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <p className="text-sm font-semibold text-purple-400">AI Performance Summary</p>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{report.summary}</p>
      </div>

      {report.areas.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Your Training Focus Areas</p>
          {report.areas.map((area, i) => (
            <div key={area.skill} className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/40 transition-colors"
                onClick={() => setOpenArea(openArea === i ? null : i)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white">{area.skill}</p>
                    <PriorityBadge priority={area.priority} />
                  </div>
                  <ScoreBar score={area.score} />
                </div>
                <ChevronRight className={`h-4 w-4 text-slate-500 flex-shrink-0 transition-transform ${openArea === i ? 'rotate-90' : ''}`} />
              </button>

              {openArea === i && (
                <div className="border-t border-slate-800 px-4 pb-4 pt-3 space-y-4">
                  <p className="text-sm text-slate-400 leading-relaxed">{area.advice}</p>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Training Videos on YouTube</p>
                    <div className="space-y-2">
                      {area.drills.map(drill => (
                        <a
                          key={drill.url}
                          href={drill.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2.5 hover:border-purple-600/40 hover:bg-purple-600/10 transition-all group"
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-600/20">
                            <svg className="h-3.5 w-3.5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-200 group-hover:text-white truncate">{drill.title}</p>
                            <p className="text-xs text-slate-500">Search on YouTube →</p>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-slate-600 group-hover:text-purple-400 flex-shrink-0 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Your Personalized Weekly Plan</p>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 divide-y divide-slate-800 overflow-hidden">
          {report.weeklyPlan.map(({ day, focus, duration, videos }) => {
            const isRest = day === 'Thursday'
            const isMatch = day === 'Saturday'
            return (
              <WeekDayRow key={day} day={day} focus={focus} duration={duration} videos={videos} isRest={isRest} isMatch={isMatch} />
            )
          })}
        </div>
      </div>

      <p className="text-xs text-slate-600 text-center">Tap any day to see its training videos</p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const SAVE_KEY = (uid: string, pos: string) => `coach_assessment_${uid}_${pos}`

export default function AICoach() {
  const { seasonStats, matches, profile } = useAppData()
  const position = profile.primaryPosition ?? 'CM'
  const posGroup = getPositionGroup(position)
  const questions = QUESTION_SETS[posGroup]
  const uid = profile.userId ?? 'demo'

  // Load any previously saved assessment for this player+position
  const savedRaw = localStorage.getItem(SAVE_KEY(uid, position))
  const saved = savedRaw ? JSON.parse(savedRaw) as { answers: Record<string, number>; report: TrainingReport } : null

  const buildInitialMessages = (): Message[] => {
    if (saved) {
      return [
        {
          id: '0',
          role: 'ai',
          content: `Welcome back${profile.name ? `, ${profile.name.split(' ')[0]}` : ''}! I've got your **${position}** assessment saved — jumping straight to your training plan. Ask me anything below whenever you're ready.`,
        },
        {
          id: '1',
          role: 'ai',
          content: "Here's your current training report:",
          report: saved.report,
        },
        {
          id: '2',
          role: 'ai',
          content: `Ask me anything about your game as a ${position} — finishing, weak foot, reading the game, how to beat defenders, fitness, anything. I'll give you a real answer.`,
        },
      ]
    }
    return [{
      id: '0',
      role: 'ai',
      content: `Hey${profile.name ? ` ${profile.name.split(' ')[0]}` : ''}! I'm your **AI Performance Coach**.\n\nI can see you play **${position}**, so I've built ${questions.length} questions specifically for your position. Be honest with your answers — the more accurate, the better your training plan.\n\nI'll give you a personalized weekly schedule with YouTube training videos matched to your exact weak areas. And once you're done, you can ask me anything about your game.\n\nReady?`,
      options: ["Let's go!"],
    }]
  }

  const [messages, setMessages] = useState<Message[]>(buildInitialMessages)
  const [questionIndex, setQuestionIndex] = useState(-1)
  const [answers, setAnswers] = useState<Record<string, number>>(saved?.answers ?? {})
  const [inputValue, setInputValue] = useState('')
  const [done, setDone] = useState(!!saved)
  const [isThinking, setIsThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const addMessage = (msg: Omit<Message, 'id'>) =>
    setMessages(prev => [...prev, { ...msg, id: crypto.randomUUID() }])

  const disableLastOptions = () =>
    setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, options: undefined } : m))

  const thinkThen = (delayMs: number, fn: () => void) => {
    setIsThinking(true)
    setTimeout(() => {
      setIsThinking(false)
      fn()
    }, delayMs)
  }

  const handleOption = (option: string, optionIndex: number) => {
    disableLastOptions()
    addMessage({ role: 'user', content: option })

    if (questionIndex === -1) {
      thinkThen(600, () => askQuestion(0))
    } else {
      const q = questions[questionIndex]
      const newAnswers = { ...answers, [q.id]: optionIndex }
      setAnswers(newAnswers)
      const next = questionIndex + 1
      if (next < questions.length) {
        thinkThen(500, () => askQuestion(next))
      } else {
        thinkThen(400, () => generateReport(newAnswers))
      }
    }
  }

  const askQuestion = (index: number) => {
    setQuestionIndex(index)
    const q = questions[index]
    addMessage({
      role: 'ai',
      content: `**(${index + 1}/${questions.length})** ${q.text}`,
      options: q.options,
    })
  }

  const generateReport = (finalAnswers: Record<string, number>) => {
    setIsThinking(true)
    setTimeout(() => {
      setIsThinking(false)
      const report = buildReport(finalAnswers, questions, {
        avgPassAccuracy: seasonStats.avgPassAccuracy,
        matches: matches.length,
      }, position)
      // Save so they never have to redo it
      localStorage.setItem(SAVE_KEY(uid, position), JSON.stringify({ answers: finalAnswers, report }))
      addMessage({ role: 'ai', content: "Alright, here's your full training report:", report })
      thinkThen(1000, () => {
        addMessage({
          role: 'ai',
          content: `Now ask me **anything** — weak foot, getting faster, how to beat defenders, finishing, confidence before big games, how to impress a scout. Whatever's on your mind as a ${position}, I'll give you a real answer.`,
        })
        setDone(true)
      })
    }, 2200)
  }

  const handleTextSubmit = async () => {
    const text = inputValue.trim()
    if (!text || isThinking) return
    setInputValue('')
    addMessage({ role: 'user', content: text })
    setIsThinking(true)

    // Build conversation history from messages (exclude reports/options)
    const history = messages
      .filter(m => m.content && !m.report)
      .map(m => ({ role: m.role === 'ai' ? 'assistant' as const : 'user' as const, content: m.content }))

    // Weak area IDs from assessment
    const scores = [20, 42, 65, 88]
    const weakAreas = Object.entries(answers)
      .map(([id, idx]) => ({ id, score: scores[idx] ?? 65 }))
      .filter(a => a.score < 62)
      .map(a => a.id.replace(/_/g, ' '))

    try {
      const res = await fetch('https://pitchiq-production-facc.up.railway.app/api/coach/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, position, weakAreas, matchCount: matches.length, history }),
      })

      if (!res.ok || !res.body) throw new Error('Server unavailable')

      // Stream the response word by word
      const msgId = crypto.randomUUID()
      setMessages(prev => [...prev, { id: msgId, role: 'ai', content: '' }])
      setIsThinking(false)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') break
          try {
            const { text: chunk, error } = JSON.parse(payload)
            if (error) throw new Error(error)
            if (chunk) {
              setMessages(prev => prev.map(m =>
                m.id === msgId ? { ...m, content: m.content + chunk } : m
              ))
            }
          } catch {}
        }
      }
    } catch {
      // Server not running or no API key — fall back to local engine
      setIsThinking(false)
      const delay = Math.min(2500, Math.max(1200, text.length * 16))
      setIsThinking(true)
      setTimeout(() => {
        setIsThinking(false)
        addMessage({ role: 'ai', content: generateAIAnswer(text, position, answers) })
      }, delay)
    }
  }

  const restart = () => {
    localStorage.removeItem(SAVE_KEY(uid, position))
    setMessages([{
      id: '0',
      role: 'ai',
      content: `Fresh start — let's redo your **${position}** assessment. ${questions.length} questions and I'll rebuild your training plan from scratch. Ready?`,
      options: ["Let's go!"],
    }])
    setQuestionIndex(-1)
    setAnswers({})
    setDone(false)
    setInputValue('')
    setIsThinking(false)
  }

  const fmt = (text: string) => text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-red-400 hover:text-red-300 underline underline-offset-2 font-medium">▶ $1</a>')
    .replace(/\n/g, '<br />')

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-3.5rem)] -m-4 lg:-m-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 lg:px-6 bg-slate-950/80 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600/20">
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">AI Performance Coach</h1>
            <p className="text-xs text-slate-500">{position} training plan · Powered by MyFutbolPro</p>
          </div>
        </div>
        <Button variant="ghost" onClick={restart} className="text-xs gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" /> Restart
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full mt-0.5 ${
              msg.role === 'ai' ? 'bg-purple-600/20' : 'bg-pitch-600/20'
            }`}>
              {msg.role === 'ai'
                ? <Bot className="h-3.5 w-3.5 text-purple-400" />
                : <User className="h-3.5 w-3.5 text-pitch-400" />}
            </div>

            <div className={`flex flex-col gap-2 max-w-[88%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.content && (
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'ai'
                      ? 'bg-slate-800/60 text-slate-300 rounded-tl-sm'
                      : 'bg-pitch-600/20 text-slate-200 border border-pitch-600/30 rounded-tr-sm'
                  }`}
                  dangerouslySetInnerHTML={{ __html: fmt(msg.content) }}
                />
              )}

              {msg.options && (
                <div className="flex flex-col gap-1.5 w-full">
                  {msg.options.map((opt, i) => (
                    <button
                      key={opt}
                      onClick={() => handleOption(opt, i)}
                      className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-2.5 text-sm text-slate-200 hover:border-purple-600/50 hover:bg-purple-600/10 hover:text-white transition-all text-left group"
                    >
                      <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-purple-400 flex-shrink-0" />
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {msg.report && <ReportCard report={msg.report} />}
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {isThinking && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-800 px-4 py-3 lg:px-6 flex-shrink-0 bg-slate-950/80">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
              placeholder={done ? `Ask anything — weak foot, fitness, dribbling, how to impress a coach…` : 'Complete the assessment above first…'}
              disabled={!done}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600/50 disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>
          <Button variant="primary" onClick={handleTextSubmit} disabled={!done || !inputValue.trim()} className="px-3 bg-purple-600 hover:bg-purple-500">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
