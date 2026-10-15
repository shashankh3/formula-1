export type DIChartType = 'table' | 'pie' | 'bar';

export interface DIQuestion {
  id: string;
  title: string;
  chartType: DIChartType;
  examTag: string;
  scenario: string;
  chartData: {
    headers?: string[];
    rows?: (string | number)[][];
    labels?: string[];
    values?: (string | number)[];
    unit?: string;
    legend?: string;
  };
  prompt: string;
  options: string[];
  correctIndex: number;
  speedShortcut: string;
  trapAlert: string;
}

export const DI_QUESTIONS: DIQuestion[] = [
  {
    id: 'di-pie-expenditure',
    title: 'Family Monthly Budget Pie Chart',
    chartType: 'pie',
    examTag: 'SSC CGL 2023 Tier-1 • Sector Angle Reflex',
    scenario: 'Monthly family budget breakdown (Total Income = ₹72,000).',
    chartData: {
      labels: ['Rent', 'Food', 'Education', 'Transport', 'Savings'],
      values: ['25%', '30%', '15%', '10%', '20%'],
      unit: '% of Total',
      legend: 'Total: 100% (360°)',
    },
    prompt: 'What is the central angle (in degrees) representing Food and Education together?',
    options: ['162°', '144°', '150°', '180°'],
    correctIndex: 0,
    speedShortcut: 'Food + Education = 30% + 15% = 45%. Since 1% = 3.6°, 45% = 45 × 3.6 = 45 × 18/5 = 9 × 18 = 162°! (Also: 45% is just under 50% / 180°).',
    trapAlert: 'TRAP: Calculating rupees first (₹32,400) and then converting to degrees waste 40s! Work directly in % ➔ 3.6° multiplier.',
  },
  {
    id: 'di-table-production',
    title: 'Automobile Factory Output (2020-2023)',
    chartType: 'table',
    examTag: 'SSC CGL 2022 Tier-1 • Base Year Ratio',
    scenario: 'Production of four models (A, B, C, D) in thousands of units.',
    chartData: {
      headers: ['Model', '2020', '2021', '2022', '2023'],
      rows: [
        ['Model A', 140, 160, 175, 210],
        ['Model B', 90, 105, 120, 150],
        ['Model C', 80, 75, 95, 120],
        ['Model D', 120, 140, 160, 180],
      ],
      unit: "'000 Units",
    },
    prompt: 'What is the percentage increase in production of Model B from 2020 to 2023?',
    options: ['66.67%', '60.00%', '50.00%', '40.00%'],
    correctIndex: 0,
    speedShortcut: 'Model B 2020 = 90, 2023 = 150. Rise = 150 - 90 = 60. Ratio jump = 60/90 = 2/3. 2/3 = 66.67% instant strike!',
    trapAlert: 'TRAP: Dividing by 2023 value (60/150 = 40%) instead of initial base 90! Base year is always the starting year.',
  },
  {
    id: 'di-bar-imports-exports',
    title: 'Trade Balance Bar Chart',
    chartType: 'bar',
    examTag: 'SSC CGL 2023 Tier-1 • Deficit Ratio',
    scenario: 'Exports and Imports of a manufacturing firm over four financial years.',
    chartData: {
      labels: ['FY 2020', 'FY 2021', 'FY 2022', 'FY 2023'],
      values: [
        'Exp: 420 | Imp: 480',
        'Exp: 500 | Imp: 550',
        'Exp: 640 | Imp: 600',
        'Exp: 750 | Imp: 720',
      ],
      unit: '₹ In Crores',
      legend: 'Exports vs Imports',
    },
    prompt: 'In how many years did the firm experience a trade surplus (Exports > Imports)?',
    options: ['2 years', '1 year', '3 years', '0 years'],
    correctIndex: 0,
    speedShortcut: 'Scan bars visually: FY 2022 (640 > 600) and FY 2023 (750 > 720). Exactly 2 years have surplus. Takes 3 seconds!',
    trapAlert: 'TRAP: Calculating total surplus in rupees when question only asked for number of years.',
  },
  {
    id: 'di-table-marks-students',
    title: 'SSC CGL Mock Test Scorecard',
    chartType: 'table',
    examTag: 'SSC CGL 2021 Tier-1 • Average Deviation Strike',
    scenario: 'Marks obtained by 4 candidates across 3 sections (Max Marks: 50 per section).',
    chartData: {
      headers: ['Candidate', 'Quant', 'Reasoning', 'English'],
      rows: [
        ['Rohit', 46, 44, 38],
        ['Aman', 42, 48, 40],
        ['Priya', 50, 46, 44],
        ['Neha', 38, 42, 36],
      ],
      unit: 'Marks / 50',
    },
    prompt: 'What is the average score of Priya across all three sections?',
    options: ['46.67', '48.00', '45.33', '44.50'],
    correctIndex: 0,
    speedShortcut: 'Priya: 50, 46, 44. Assume base 46: deviations are (+4, 0, -2) = +2. Avg = 46 + 2/3 = 46.67!',
    trapAlert: 'TRAP: Adding big numbers slowly. Use assumed mean 46 and deviation (+4, 0, -2)/3.',
  },
  {
    id: 'di-pie-degrees',
    title: 'State Budget Allocation (Degrees Chart)',
    chartType: 'pie',
    examTag: 'SSC CGL 2023 Tier-1 • Degree-to-Rupee Reflex',
    scenario: 'State expenditure of ₹18,000 Crores distributed in degrees around the circle.',
    chartData: {
      labels: ['Infrastructure', 'Healthcare', 'Agriculture', 'Education', 'Others'],
      values: ['108°', '72°', '90°', '54°', '36°'],
      unit: 'Degrees (°)',
      legend: 'Total: 360° = ₹18,000 Cr',
    },
    prompt: 'What is the total expenditure allocated to Healthcare and Education combined?',
    options: ['₹6,300 Cr', '₹5,400 Cr', '₹7,200 Cr', '₹6,000 Cr'],
    correctIndex: 0,
    speedShortcut: 'Healthcare (72°) + Education (54°) = 126°. Since 360° = 18,000 Cr, 1° = 18,000/360 = 50 Cr. Combined = 126 × 50 = ₹6,300 Cr!',
    trapAlert: 'TRAP: Calculating 72° value and 54° value separately. Always sum the angles first: 72 + 54 = 126°.',
  },
  {
    id: 'di-bar-gender-ratio',
    title: 'College Enrollment by Stream',
    chartType: 'bar',
    examTag: 'SSC CGL 2022 Tier-1 • Cross Ratio Strike',
    scenario: 'Number of Male and Female students enrolled in 3 academic streams.',
    chartData: {
      labels: ['Engineering', 'Medical', 'Arts'],
      values: ['M: 600 | F: 400', 'M: 350 | F: 450', 'M: 250 | F: 500'],
      unit: 'Students',
      legend: 'M: Males | F: Females',
    },
    prompt: 'What is the overall ratio of total male students to total female students across all 3 streams?',
    options: ['8 : 9', '1 : 1', '6 : 7', '4 : 5'],
    correctIndex: 0,
    speedShortcut: 'Total Males = 600 + 350 + 250 = 1200. Total Females = 400 + 450 + 500 = 1350. Ratio = 1200 : 1350 = 120 : 135 = 8 : 9.',
    trapAlert: 'TRAP: Calculating ratios stream by stream and then averaging them. You must sum total counts first!',
  },
  {
    id: 'di-table-pass-percentage',
    title: 'School Examination Pass Stats',
    chartType: 'table',
    examTag: 'SSC CGL 2023 Tier-1 • Direct % Comparison',
    scenario: 'Total students appeared vs passed in 4 sections of Class 10.',
    chartData: {
      headers: ['Section', 'Appeared', 'Passed'],
      rows: [
        ['Sec A', 50, 45],
        ['Sec B', 60, 48],
        ['Sec C', 40, 36],
        ['Sec D', 80, 68],
      ],
      unit: 'Students',
    },
    prompt: 'Which section recorded the highest pass percentage?',
    options: ['Sec A and Sec C (tie at 90%)', 'Sec D (85%)', 'Sec B (80%)', 'Sec C (90% only)'],
    correctIndex: 0,
    speedShortcut: 'Sec A = 45/50 = 90%. Sec B = 48/60 = 80%. Sec C = 36/40 = 90%. Sec D = 68/80 = 17/20 = 85%. Both Sec A and Sec C have 90%!',
    trapAlert: 'TRAP: Looking only at raw pass count (68 in Sec D) instead of percentage on appeared base.',
  },
  {
    id: 'di-pie-market-share',
    title: 'Smartphone Brand Market Share',
    chartType: 'pie',
    examTag: 'SSC CGL 2021 Tier-1 • Relative % Difference',
    scenario: 'Total market shipment = 12 million units.',
    chartData: {
      labels: ['Brand X', 'Brand Y', 'Brand Z', 'Brand W', 'Others'],
      values: ['32%', '24%', '18%', '14%', '12%'],
      unit: '% Share',
      legend: 'Total: 100% (12M units)',
    },
    prompt: 'By what percentage is Brand X market share greater than Brand Y market share?',
    options: ['33.33%', '8.00%', '25.00%', '50.00%'],
    correctIndex: 0,
    speedShortcut: 'Difference = 32% - 24% = 8%. Divided by base Brand Y (24%) = 8/24 = 1/3 = 33.33%!',
    trapAlert: 'TRAP: Stating the difference is 8%. The question asks "by what % greater than Y", so denominator must be Y (24%), not 100!',
  },
];
