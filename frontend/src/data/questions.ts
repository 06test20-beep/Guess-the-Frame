import type { Question } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
//  All 40 questions.
//  Images: drop your actual files into the folders under public/assets/levels/
//  and update the `imagePath` values below.
//  Dialogue questions have no imagePath.
// ─────────────────────────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  // ── Level 1: Bollywood Frames ─────────────────────────────────────────────
  { id:'l1q01', level:1, questionNumber:1,  type:'frame',    imagePath:'/assets/levels/level-1-bollywood/q01.jpg', answer:'Sholay',              year:1975 },
  { id:'l1q02', level:1, questionNumber:2,  type:'frame',    imagePath:'/assets/levels/level-1-bollywood/q02.jpg', answer:'Dilwale Dulhania Le Jayenge', year:1995 },
  { id:'l1q03', level:1, questionNumber:3,  type:'frame',    imagePath:'/assets/levels/level-1-bollywood/q03.jpg', answer:'3 Idiots',            year:2009 },
  { id:'l1q04', level:1, questionNumber:4,  type:'frame',    imagePath:'/assets/levels/level-1-bollywood/q04.jpg', answer:'Mughal-E-Azam',       year:1960 },
  { id:'l1q05', level:1, questionNumber:5,  type:'frame',    imagePath:'/assets/levels/level-1-bollywood/q05.jpg', answer:'Devdas',              year:2002 },
  { id:'l1q06', level:1, questionNumber:6,  type:'frame',    imagePath:'/assets/levels/level-1-bollywood/q06.jpg', answer:'Dangal',              year:2016 },
  { id:'l1q07', level:1, questionNumber:7,  type:'frame',    imagePath:'/assets/levels/level-1-bollywood/q07.jpg', answer:'Bajrangi Bhaijaan',   year:2015 },
  { id:'l1q08', level:1, questionNumber:8,  type:'frame',    imagePath:'/assets/levels/level-1-bollywood/q08.jpg', answer:'Lagaan',              year:2001 },
  { id:'l1q09', level:1, questionNumber:9,  type:'frame',    imagePath:'/assets/levels/level-1-bollywood/q09.jpg', answer:'Taare Zameen Par',    year:2007 },
  { id:'l1q10', level:1, questionNumber:10, type:'frame',    imagePath:'/assets/levels/level-1-bollywood/q10.jpg', answer:'Queen',               year:2014 },

  // ── Level 2: Hollywood Frames ─────────────────────────────────────────────
  { id:'l2q01', level:2, questionNumber:1,  type:'frame',    imagePath:'/assets/levels/level-2-hollywood/q01.jpg', answer:'2001: A Space Odyssey', year:1968 },
  { id:'l2q02', level:2, questionNumber:2,  type:'frame',    imagePath:'/assets/levels/level-2-hollywood/q02.jpg', answer:'The Godfather',       year:1972 },
  { id:'l2q03', level:2, questionNumber:3,  type:'frame',    imagePath:'/assets/levels/level-2-hollywood/q03.jpg', answer:'Schindler\'s List',   year:1993 },
  { id:'l2q04', level:2, questionNumber:4,  type:'frame',    imagePath:'/assets/levels/level-2-hollywood/q04.jpg', answer:'Forrest Gump',        year:1994 },
  { id:'l2q05', level:2, questionNumber:5,  type:'frame',    imagePath:'/assets/levels/level-2-hollywood/q05.jpg', answer:'The Dark Knight',     year:2008 },
  { id:'l2q06', level:2, questionNumber:6,  type:'frame',    imagePath:'/assets/levels/level-2-hollywood/q06.jpg', answer:'Pulp Fiction',        year:1994 },
  { id:'l2q07', level:2, questionNumber:7,  type:'frame',    imagePath:'/assets/levels/level-2-hollywood/q07.jpg', answer:'Inception',           year:2010 },
  { id:'l2q08', level:2, questionNumber:8,  type:'frame',    imagePath:'/assets/levels/level-2-hollywood/q08.jpg', answer:'The Matrix',          year:1999 },
  { id:'l2q09', level:2, questionNumber:9,  type:'frame',    imagePath:'/assets/levels/level-2-hollywood/q09.jpg', answer:'Interstellar',        year:2014 },
  { id:'l2q10', level:2, questionNumber:10, type:'frame',    imagePath:'/assets/levels/level-2-hollywood/q10.jpg', answer:'Parasite',            year:2019 },

  // ── Level 3: Eyes ─────────────────────────────────────────────────────────
  { id:'l3q01', level:3, questionNumber:1,  type:'eye',      imagePath:'/assets/levels/level-3-eyes/q01.jpg', answer:'Shah Rukh Khan'  },
  { id:'l3q02', level:3, questionNumber:2,  type:'eye',      imagePath:'/assets/levels/level-3-eyes/q02.jpg', answer:'Priyanka Chopra' },
  { id:'l3q03', level:3, questionNumber:3,  type:'eye',      imagePath:'/assets/levels/level-3-eyes/q03.jpg', answer:'Antony Starr'    },
  { id:'l3q04', level:3, questionNumber:4,  type:'eye',      imagePath:'/assets/levels/level-3-eyes/q04.jpg', answer:'Deepika Padukone'},
  { id:'l3q05', level:3, questionNumber:5,  type:'eye',      imagePath:'/assets/levels/level-3-eyes/q05.jpg', answer:'Ranveer Singh'   },
  { id:'l3q06', level:3, questionNumber:6,  type:'eye',      imagePath:'/assets/levels/level-3-eyes/q06.jpg', answer:'Alia Bhatt'      },
  { id:'l3q07', level:3, questionNumber:7,  type:'eye',      imagePath:'/assets/levels/level-3-eyes/q07.jpg', answer:'Akshay Kumar'    },
  { id:'l3q08', level:3, questionNumber:8,  type:'eye',      imagePath:'/assets/levels/level-3-eyes/q08.jpg', answer:'Katrina Kaif'    },
  { id:'l3q09', level:3, questionNumber:9,  type:'eye',      imagePath:'/assets/levels/level-3-eyes/q09.jpg', answer:'Hrithik Roshan'  },
  { id:'l3q10', level:3, questionNumber:10, type:'eye',      imagePath:'/assets/levels/level-3-eyes/q10.jpg', answer:'Kangana Ranaut'  },

  // ── Level 4: Dialogues ────────────────────────────────────────────────────
  {
    id:'l4q01', level:4, questionNumber:1,  type:'dialogue',
    dialogue: '"Kitne aadmi the?"',
    hint: 'Classic Bollywood dialogue',
    answer: 'Sholay', year: 1975
  },
  {
    id:'l4q02', level:4, questionNumber:2,  type:'dialogue',
    dialogue: '"Mere paas maa hai."',
    hint: 'Iconic line from a Bollywood classic',
    answer: 'Deewar', year: 1975
  },
  {
    id:'l4q03', level:4, questionNumber:3,  type:'dialogue',
    dialogue: '"Aaya hoon, kuch toh loot kar jaunga... Khandani chor hoon main, khandani!"',
    hint: 'Comedy hit',
    answer: 'Golmaal', year: 2006
  },
  {
    id:'l4q04', level:4, questionNumber:4,  type:'dialogue',
    dialogue: '"Bade bade deshon mein aisi choti choti baatein hoti rehti hai, Senorita."',
    hint: 'SRK charm at its peak',
    answer: 'Dilwale Dulhania Le Jayenge', year: 1995
  },
  {
    id:'l4q05', level:4, questionNumber:5,  type:'dialogue',
    dialogue: '"All is well."',
    hint: 'Three idiots',
    answer: '3 Idiots', year: 2009
  },
  {
    id:'l4q06', level:4, questionNumber:6,  type:'dialogue',
    dialogue: '"Rishte mein toh hum tumhare baap lagte hain, naam hai Shahenshah."',
    hint: 'Big B at his best',
    answer: 'Shahenshah', year: 1988
  },
  {
    id:'l4q07', level:4, questionNumber:7,  type:'dialogue',
    dialogue: '"Picture abhi baaki hai mere dost."',
    hint: 'Dabangg ending',
    answer: 'Dabangg', year: 2010
  },
  {
    id:'l4q08', level:4, questionNumber:8,  type:'dialogue',
    dialogue: '"Mogambo khush hua!"',
    hint: 'Classic villain line',
    answer: 'Mr. India', year: 1987
  },
  {
    id:'l4q09', level:4, questionNumber:9,  type:'dialogue',
    dialogue: '"Yeh koi tareeka hai bheek maangne ka?!"',
    hint: 'Classic comedy',
    answer: 'Golmaal', year: 2006
  },
  {
    id:'l4q10', level:4, questionNumber:10, type:'dialogue',
    dialogue: '"Don ko pakadna mushkil hi nahin, namumkin hai."',
    hint: 'SRK is Don',
    answer: 'Don', year: 2006
  },
];

export default QUESTIONS;

export function getQuestionsForLevel(level: number): Question[] {
  return QUESTIONS.filter(q => q.level === level).sort(
    (a, b) => a.questionNumber - b.questionNumber
  );
}
