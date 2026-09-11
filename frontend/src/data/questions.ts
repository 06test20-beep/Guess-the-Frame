import type { Question } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
//  Default questions — level IDs must match LEVELS in constants/game.ts
//
//  Level 1: Hollywood          (frame)    → /assets/levels/level-2-hollywood/
//  Level 2: Indian Movies      (frame)    → /assets/levels/level-1-bollywood/
//  Level 3: Distorted Frame    (frame)    → /assets/levels/level-2-hollywood/ (fallback)
//  Level 4: Guess The Eyes     (eye)      → /assets/levels/level-3-eyes/
//  Level 5: Guess The Dialogues(dialogue) → (no images)
//  Level 6: Guess Release Year (frame)    → /assets/levels/level-1-bollywood/ (fallback)
//  Level 7: Bollywood In English(dialogue)→ (no images)
//  Level 8: Hollywood In Hindi (dialogue) → (no images)
//  Level 9: This and That      (frame)    → /assets/levels/level-1-bollywood/ (fallback)
// ─────────────────────────────────────────────────────────────────────────────

const QUESTIONS: any[] = [
  // ── Level 1: Hollywood Frames ─────────────────────────────────────────────
  { id:'l1q01', level:1, questionNumber:1,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q01.jpg', answer:'2001: A Space Odyssey', year:1968 },
  { id:'l1q02', level:1, questionNumber:2,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q02.jpg', answer:'The Godfather',        year:1972 },
  { id:'l1q03', level:1, questionNumber:3,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q03.jpg', answer:"Schindler's List",     year:1993 },
  { id:'l1q04', level:1, questionNumber:4,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q04.jpg', answer:'Forrest Gump',          year:1994 },
  { id:'l1q05', level:1, questionNumber:5,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q05.jpg', answer:'The Dark Knight',       year:2008 },
  { id:'l1q06', level:1, questionNumber:6,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q06.jpg', answer:'Pulp Fiction',           year:1994 },
  { id:'l1q07', level:1, questionNumber:7,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q07.jpg', answer:'Inception',              year:2010 },
  { id:'l1q08', level:1, questionNumber:8,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q08.jpg', answer:'The Matrix',             year:1999 },
  { id:'l1q09', level:1, questionNumber:9,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q09.jpg', answer:'Interstellar',           year:2014 },
  { id:'l1q10', level:1, questionNumber:10, type:'frame', imagePath:'/assets/levels/level-2-hollywood/q10.jpg', answer:'Parasite',               year:2019 },

  // ── Level 2: Indian Movies ────────────────────────────────────────────────
  { id:'l2q01', level:2, questionNumber:1,  type:'frame', imagePath:'/assets/levels/level-1-bollywood/q01.jpg', answer:'Sholay',                    year:1975 },
  { id:'l2q02', level:2, questionNumber:2,  type:'frame', imagePath:'/assets/levels/level-1-bollywood/q02.jpg', answer:'Dilwale Dulhania Le Jayenge',year:1995 },
  { id:'l2q03', level:2, questionNumber:3,  type:'frame', imagePath:'/assets/levels/level-1-bollywood/q03.jpg', answer:'3 Idiots',                  year:2009 },
  { id:'l2q04', level:2, questionNumber:4,  type:'frame', imagePath:'/assets/levels/level-1-bollywood/q04.jpg', answer:'Mughal-E-Azam',             year:1960 },
  { id:'l2q05', level:2, questionNumber:5,  type:'frame', imagePath:'/assets/levels/level-1-bollywood/q05.jpg', answer:'Devdas',                    year:2002 },
  { id:'l2q06', level:2, questionNumber:6,  type:'frame', imagePath:'/assets/levels/level-1-bollywood/q06.jpg', answer:'Dangal',                    year:2016 },
  { id:'l2q07', level:2, questionNumber:7,  type:'frame', imagePath:'/assets/levels/level-1-bollywood/q07.jpg', answer:'Bajrangi Bhaijaan',          year:2015 },
  { id:'l2q08', level:2, questionNumber:8,  type:'frame', imagePath:'/assets/levels/level-1-bollywood/q08.jpg', answer:'Lagaan',                    year:2001 },
  { id:'l2q09', level:2, questionNumber:9,  type:'frame', imagePath:'/assets/levels/level-1-bollywood/q09.jpg', answer:'Taare Zameen Par',           year:2007 },
  { id:'l2q10', level:2, questionNumber:10, type:'frame', imagePath:'/assets/levels/level-1-bollywood/q10.jpg', answer:'Queen',                     year:2014 },

  // ── Level 3: Distorted Frame (uses hollywood as fallback — add level-3-distorted folder to override) ──
  { id:'l3q01', level:3, questionNumber:1,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q01.jpg', answer:'Sholay',               year:1975 },
  { id:'l3q02', level:3, questionNumber:2,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q02.jpg', answer:'The Dark Knight',      year:2008 },
  { id:'l3q03', level:3, questionNumber:3,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q03.jpg', answer:'3 Idiots',             year:2009 },
  { id:'l3q04', level:3, questionNumber:4,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q04.jpg', answer:'Inception',             year:2010 },
  { id:'l3q05', level:3, questionNumber:5,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q05.jpg', answer:'Forrest Gump',          year:1994 },
  { id:'l3q06', level:3, questionNumber:6,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q06.jpg', answer:'Dangal',                year:2016 },
  { id:'l3q07', level:3, questionNumber:7,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q07.jpg', answer:'The Matrix',            year:1999 },
  { id:'l3q08', level:3, questionNumber:8,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q08.jpg', answer:'Interstellar',          year:2014 },
  { id:'l3q09', level:3, questionNumber:9,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q09.jpg', answer:'Bajrangi Bhaijaan',     year:2015 },
  { id:'l3q10', level:3, questionNumber:10, type:'frame', imagePath:'/assets/levels/level-2-hollywood/q10.jpg', answer:'Dilwale Dulhania Le Jayenge', year:1995 },

  // ── Level 4: Guess The Eyes ───────────────────────────────────────────────
  { id:'l4q01', level:4, questionNumber:1,  type:'eye', imagePath:'/assets/levels/level-3-eyes/q01.jpg', answer:'Shah Rukh Khan'   },
  { id:'l4q02', level:4, questionNumber:2,  type:'eye', imagePath:'/assets/levels/level-3-eyes/q02.jpg', answer:'Priyanka Chopra'  },
  { id:'l4q03', level:4, questionNumber:3,  type:'eye', imagePath:'/assets/levels/level-3-eyes/q03.jpg', answer:'Antony Starr'     },
  { id:'l4q04', level:4, questionNumber:4,  type:'eye', imagePath:'/assets/levels/level-3-eyes/q04.jpg', answer:'Deepika Padukone' },
  { id:'l4q05', level:4, questionNumber:5,  type:'eye', imagePath:'/assets/levels/level-3-eyes/q05.jpg', answer:'Ranveer Singh'    },
  { id:'l4q06', level:4, questionNumber:6,  type:'eye', imagePath:'/assets/levels/level-3-eyes/q06.jpg', answer:'Alia Bhatt'       },
  { id:'l4q07', level:4, questionNumber:7,  type:'eye', imagePath:'/assets/levels/level-3-eyes/q07.jpg', answer:'Akshay Kumar'     },
  { id:'l4q08', level:4, questionNumber:8,  type:'eye', imagePath:'/assets/levels/level-3-eyes/q08.jpg', answer:'Katrina Kaif'     },
  { id:'l4q09', level:4, questionNumber:9,  type:'eye', imagePath:'/assets/levels/level-3-eyes/q09.jpg', answer:'Hrithik Roshan'   },
  { id:'l4q10', level:4, questionNumber:10, type:'eye', imagePath:'/assets/levels/level-3-eyes/q10.jpg', answer:'Kangana Ranaut'   },

  // ── Level 5: Guess The Dialogues ──────────────────────────────────────────
  { id:'l5q01', level:5, questionNumber:1,  type:'dialogue', dialogue:'"Kitne aadmi the?"',                                                     hint:'Classic Bollywood dialogue',         answer:'Sholay',                     year:1975 },
  { id:'l5q02', level:5, questionNumber:2,  type:'dialogue', dialogue:'"Mere paas maa hai."',                                                   hint:'Iconic line from a Bollywood classic', answer:'Deewar',                   year:1975 },
  { id:'l5q03', level:5, questionNumber:3,  type:'dialogue', dialogue:'"Aaya hoon, kuch toh loot kar jaunga... Khandani chor hoon main!"',      hint:'Comedy hit',                         answer:'Golmaal',                    year:2006 },
  { id:'l5q04', level:5, questionNumber:4,  type:'dialogue', dialogue:'"Bade bade deshon mein aisi choti choti baatein hoti rehti hai, Senorita."', hint:'SRK charm at its peak',          answer:'Dilwale Dulhania Le Jayenge', year:1995 },
  { id:'l5q05', level:5, questionNumber:5,  type:'dialogue', dialogue:'"All is well."',                                                          hint:'Three idiots',                       answer:'3 Idiots',                   year:2009 },
  { id:'l5q06', level:5, questionNumber:6,  type:'dialogue', dialogue:'"Rishte mein toh hum tumhare baap lagte hain, naam hai Shahenshah."',    hint:'Big B at his best',                  answer:'Shahenshah',                 year:1988 },
  { id:'l5q07', level:5, questionNumber:7,  type:'dialogue', dialogue:'"Picture abhi baaki hai mere dost."',                                    hint:'Dabangg ending',                     answer:'Dabangg',                    year:2010 },
  { id:'l5q08', level:5, questionNumber:8,  type:'dialogue', dialogue:'"Mogambo khush hua!"',                                                   hint:'Classic villain line',                answer:'Mr. India',                  year:1987 },
  { id:'l5q09', level:5, questionNumber:9,  type:'dialogue', dialogue:'"Yeh koi tareeka hai bheek maangne ka?!"',                               hint:'Classic comedy',                     answer:'Golmaal',                    year:2006 },
  { id:'l5q10', level:5, questionNumber:10, type:'dialogue', dialogue:'"Don ko pakadna mushkil hi nahin, namumkin hai."',                       hint:'SRK is Don',                         answer:'Don',                        year:2006 },

  // ── Level 6: Guess Release Year ───────────────────────────────────────────
  { id:'l6q01', level:6, questionNumber:1,  type:'frame', imagePath:'/assets/levels/level-1-bollywood/q01.jpg', answer:'1975', year:1975 },
  { id:'l6q02', level:6, questionNumber:2,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q02.jpg', answer:'1972', year:1972 },
  { id:'l6q03', level:6, questionNumber:3,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q05.jpg', answer:'2008', year:2008 },
  { id:'l6q04', level:6, questionNumber:4,  type:'frame', imagePath:'/assets/levels/level-1-bollywood/q03.jpg', answer:'2009', year:2009 },
  { id:'l6q05', level:6, questionNumber:5,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q04.jpg', answer:'1994', year:1994 },
  { id:'l6q06', level:6, questionNumber:6,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q07.jpg', answer:'2010', year:2010 },
  { id:'l6q07', level:6, questionNumber:7,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q08.jpg', answer:'1999', year:1999 },
  { id:'l6q08', level:6, questionNumber:8,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q09.jpg', answer:'2014', year:2014 },
  { id:'l6q09', level:6, questionNumber:9,  type:'frame', imagePath:'/assets/levels/level-1-bollywood/q06.jpg', answer:'2016', year:2016 },
  { id:'l6q10', level:6, questionNumber:10, type:'frame', imagePath:'/assets/levels/level-2-hollywood/q01.jpg', answer:'2001', year:2001 },

  // ── Level 7: Bollywood In English ─────────────────────────────────────────
  { id:'l7q01', level:7, questionNumber:1,  type:'dialogue', dialogue:'"How many men were there?"',                    hint:'Bollywood classic in English',  answer:'Sholay',             year:1975 },
  { id:'l7q02', level:7, questionNumber:2,  type:'dialogue', dialogue:'"I have mother."',                              hint:'Iconic Bollywood line',          answer:'Deewar',             year:1975 },
  { id:'l7q03', level:7, questionNumber:3,  type:'dialogue', dialogue:'"All is fine."',                                hint:'Engineering comedy',             answer:'3 Idiots',           year:2009 },
  { id:'l7q04', level:7, questionNumber:4,  type:'dialogue', dialogue:'"In big countries such small things keep happening, Senorita."', hint:'SRK classic', answer:'DDLJ',               year:1995 },
  { id:'l7q05', level:7, questionNumber:5,  type:'dialogue', dialogue:'"The picture is still remaining, my friend."', hint:'Salman Khan blockbuster',        answer:'Dabangg',            year:2010 },
  { id:'l7q06', level:7, questionNumber:6,  type:'dialogue', dialogue:'"Mogambo is happy!"',                          hint:'Villain dialogue',               answer:'Mr. India',          year:1987 },
  { id:'l7q07', level:7, questionNumber:7,  type:'dialogue', dialogue:'"In relationships we are your father, my name is Shahenshah."', hint:'Big B dialogue', answer:'Shahenshah',      year:1988 },
  { id:'l7q08', level:7, questionNumber:8,  type:'dialogue', dialogue:'"I came, I will loot something... I am a hereditary thief!"', hint:'Comedy classic', answer:'Golmaal',            year:2006 },
  { id:'l7q09', level:7, questionNumber:9,  type:'dialogue', dialogue:'"Catching Don is not difficult, it is impossible."',          hint:'SRK action',     answer:'Don',               year:2006 },
  { id:'l7q10', level:7, questionNumber:10, type:'dialogue', dialogue:'"Is this any way to beg?!"',                   hint:'Comedy Golmaal',                 answer:'Golmaal',            year:2006 },

  // ── Level 8: Hollywood In Hindi ───────────────────────────────────────────
  { id:'l8q01', level:8, questionNumber:1,  type:'dialogue', dialogue:'"Zindagi chocolates ke dabbe ki tarah hai — pata nahi kya milega."', hint:'Inspirational Hollywood',  answer:'Forrest Gump',   year:1994 },
  { id:'l8q02', level:8, questionNumber:2,  type:'dialogue', dialogue:'"Hum ek offer karenge jo wo thukra nahi sakenge."',                  hint:'Iconic mafia line',         answer:'The Godfather',  year:1972 },
  { id:'l8q03', level:8, questionNumber:3,  type:'dialogue', dialogue:'"Tum sach nahi sambhal sakte!"',                                     hint:'Courtroom drama',           answer:'A Few Good Men', year:1992 },
  { id:'l8q04', level:8, questionNumber:4,  type:'dialogue', dialogue:'"Mai tumhara baap hoon, Luke."',                                     hint:'Space epic twist',          answer:'The Empire Strikes Back', year:1980 },
  { id:'l8q05', level:8, questionNumber:5,  type:'dialogue', dialogue:'"Kyun ek yodha hona chahiye?"',                                      hint:'Gladiator paraphrase',      answer:'Gladiator',      year:2000 },
  { id:'l8q06', level:8, questionNumber:6,  type:'dialogue', dialogue:'"Tumhari taakat kuch nahin hai jab tak insaaf ke sath ho."',        hint:'Batman epic',               answer:'The Dark Knight',year:2008 },
  { id:'l8q07', level:8, questionNumber:7,  type:'dialogue', dialogue:'"Asli duniya mein sirf ye hai: jo tum jaante ho wo kaafi nahi."',   hint:'Matrix classic',            answer:'The Matrix',     year:1999 },
  { id:'l8q08', level:8, questionNumber:8,  type:'dialogue', dialogue:'"Sapne dekhne wale apni duniya khud banate hain."',                  hint:'Dream thriller',            answer:'Inception',      year:2010 },
  { id:'l8q09', level:8, questionNumber:9,  type:'dialogue', dialogue:'"Waqt ek anokha cheez hai — isko kho do toh wapas nahi aata."',     hint:'Space/time epic',           answer:'Interstellar',   year:2014 },
  { id:'l8q10', level:8, questionNumber:10, type:'dialogue', dialogue:'"Ameer garib sab barabar hain — qabr mein."',                       hint:'Korean thriller',           answer:'Parasite',       year:2019 },

  // ── Level 9: This and That ────────────────────────────────────────────────
  { id:'l9q01', level:9, questionNumber:1,  type:'frame', imagePath:'/assets/levels/level-1-bollywood/q01.jpg', answer:'Sholay',                    year:1975 },
  { id:'l9q02', level:9, questionNumber:2,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q02.jpg', answer:'The Godfather',              year:1972 },
  { id:'l9q03', level:9, questionNumber:3,  type:'frame', imagePath:'/assets/levels/level-1-bollywood/q03.jpg', answer:'3 Idiots',                  year:2009 },
  { id:'l9q04', level:9, questionNumber:4,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q07.jpg', answer:'Inception',                  year:2010 },
  { id:'l9q05', level:9, questionNumber:5,  type:'frame', imagePath:'/assets/levels/level-1-bollywood/q06.jpg', answer:'Dangal',                     year:2016 },
  { id:'l9q06', level:9, questionNumber:6,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q05.jpg', answer:'The Dark Knight',            year:2008 },
  { id:'l9q07', level:9, questionNumber:7,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q08.jpg', answer:'The Matrix',                 year:1999 },
  { id:'l9q08', level:9, questionNumber:8,  type:'frame', imagePath:'/assets/levels/level-2-hollywood/q09.jpg', answer:'Interstellar',               year:2014 },
  { id:'l9q09', level:9, questionNumber:9,  type:'frame', imagePath:'/assets/levels/level-1-bollywood/q07.jpg', answer:'Bajrangi Bhaijaan',          year:2015 },
  { id:'l9q10', level:9, questionNumber:10, type:'frame', imagePath:'/assets/levels/level-2-hollywood/q04.jpg', answer:'Forrest Gump',               year:1994 },
];

export default QUESTIONS as unknown as Question[];

export function getQuestionsForLevel(level: number): Question[] {
  return QUESTIONS.filter(q => q.level === level).sort(
    (a, b) => a.questionNumber - b.questionNumber
  );
}
