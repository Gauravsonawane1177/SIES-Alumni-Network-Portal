const bcrypt = require('bcrypt');
const { pool, query } = require('./config/db');
const fs = require('fs');
const path = require('path');

const DEMO_PASSWORD = 'DemoPass123!';

const branches = ['CE', 'IT', 'EXTC', 'MECH', 'PPT'];
const cities = ['Navi Mumbai', 'Mumbai', 'Pune', 'Bengaluru', 'Hyderabad'];
const companies = ['TCS', 'Infosys', 'Amazon', 'Google', 'L&T', 'Accenture', 'Microsoft', 'Capgemini'];
const skillsPool = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'Cloud', 'ML', 'UI/UX', 'DevOps'];

function pick(arr, i) {
  return arr[i % arr.length];
}

async function seed() {
  const schema = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');
  await pool.query(schema);

  await query(`
    TRUNCATE TABLE
      notifications, password_resets, donations, donation_campaigns,
      event_rsvps, events, job_applications, jobs, messages, connections, profiles, users
    RESTART IDENTITY CASCADE
  `);

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  async function createUser({ email, role, status, name, extra = {} }) {
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, role, status, email_verified)
       VALUES ($1,$2,$3,$4,TRUE) RETURNING id`,
      [email, hash, role, status]
    );
    const id = rows[0].id;
    await query(
      `INSERT INTO profiles (user_id, full_name, profile_photo, phone, branch, batch_year, graduation_year, company, job_title, city, bio, skills, linkedin_url, github_url, is_mentor)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        id,
        name,
        extra.photo || null,
        extra.phone || '9876543210',
        extra.branch || 'CE',
        extra.batch_year || 2020,
        extra.graduation_year || 2024,
        extra.company || null,
        extra.job_title || null,
        extra.city || 'Navi Mumbai',
        extra.bio || `${name} is a member of the SIES GST community.`,
        extra.skills || ['JavaScript', 'SQL'],
        extra.linkedin || 'https://www.linkedin.com',
        extra.github || 'https://github.com',
        extra.is_mentor || false
      ]
    );
    return id;
  }

  const adminId = await createUser({
    email: 'admin@siesgst.ac.in',
    role: 'ADMIN',
    status: 'ACTIVE',
    name: 'Portal Administrator',
    extra: { job_title: 'Alumni Office', company: 'SIES GST', branch: 'ADMIN' }
  });

  const alumniIds = [];
  for (let i = 0; i < 10; i += 1) {
    const email = i === 0 ? 'alumni@siesgst.ac.in' : `alumni${i + 1}@siesgst.ac.in`;
    const id = await createUser({
      email,
      role: 'ALUMNI',
      status: 'ACTIVE',
      name: i === 0 ? 'Aarav Alumni' : `Alumni Member ${i + 1}`,
      extra: {
        branch: pick(branches, i),
        batch_year: 2014 + (i % 8),
        graduation_year: 2018 + (i % 8),
        company: pick(companies, i),
        job_title: i % 2 ? 'Software Engineer' : 'Product Manager',
        city: pick(cities, i),
        skills: [pick(skillsPool, i), pick(skillsPool, i + 3), pick(skillsPool, i + 5)],
        is_mentor: i % 2 === 0
      }
    });
    alumniIds.push(id);
  }

  const studentIds = [];
  for (let i = 0; i < 10; i += 1) {
    const email = i === 0 ? 'student@siesgst.ac.in' : `student${i + 1}@siesgst.ac.in`;
    const id = await createUser({
      email,
      role: 'STUDENT',
      status: 'ACTIVE',
      name: i === 0 ? 'Sneha Student' : `Student Member ${i + 1}`,
      extra: {
        branch: pick(branches, i + 1),
        batch_year: 2022 + (i % 3),
        graduation_year: 2026 + (i % 3),
        city: pick(cities, i + 2),
        skills: [pick(skillsPool, i + 1), pick(skillsPool, i + 4)]
      }
    });
    studentIds.push(id);
  }

  await createUser({
    email: 'pending.alumni@siesgst.ac.in',
    role: 'ALUMNI',
    status: 'PENDING',
    name: 'Pending Alumni',
    extra: { company: 'Startup Inc', job_title: 'Founder', branch: 'IT', batch_year: 2019, graduation_year: 2023 }
  });

  const jobTitles = [
    ['Backend Intern', 'TCS', 'INTERNSHIP'],
    ['Frontend Engineer', 'Infosys', 'FULL_TIME'],
    ['Data Analyst', 'Amazon', 'FULL_TIME'],
    ['Campus Ambassador', 'Microsoft', 'PART_TIME'],
    ['DevOps Intern', 'Capgemini', 'INTERNSHIP']
  ];
  const jobIds = [];
  for (let i = 0; i < 5; i += 1) {
    const [title, company, type] = jobTitles[i];
    const { rows } = await query(
      `INSERT INTO jobs (posted_by, title, company, description, location, job_type, experience_required, skills, deadline, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'APPROVED') RETURNING id`,
      [
        alumniIds[i % alumniIds.length],
        title,
        company,
        `${title} opportunity for SIES GST students. Collaborate with experienced engineers and grow your career.`,
        pick(cities, i),
        type,
        i < 2 ? '0-1 years' : '1-3 years',
        [pick(skillsPool, i), pick(skillsPool, i + 2)],
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ]
    );
    jobIds.push(rows[0].id);
  }

  await query(
    `INSERT INTO job_applications (job_id, applicant_id, resume_url, cover_letter, status)
     VALUES ($1,$2,$3,$4,'APPLIED')`,
    [
      jobIds[0],
      studentIds[0],
      'https://example.com/resume.pdf',
      'I am excited to apply for this internship and contribute to the engineering team with my coursework and projects.'
    ]
  );

  const eventTitles = [
    'Alumni Mentorship Mixer',
    'Resume Review Night',
    'GST Tech Talk',
    'Homecoming Reunion',
    'Industry Panel'
  ];
  const eventIds = [];
  for (let i = 0; i < 5; i += 1) {
    const { rows } = await query(
      `INSERT INTO events (created_by, title, description, location, event_date, capacity, status)
       VALUES ($1,$2,$3,$4,$5,$6,'APPROVED') RETURNING id`,
      [
        i === 0 ? adminId : alumniIds[i],
        eventTitles[i],
        `${eventTitles[i]} brings SIES alumni and students together for learning and networking.`,
        'SIES GST, Nerul',
        new Date(Date.now() + (i + 5) * 24 * 60 * 60 * 1000),
        i === 4 ? 2 : 80
      ]
    );
    eventIds.push(rows[0].id);
  }
  await query(`INSERT INTO event_rsvps (event_id, user_id) VALUES ($1,$2)`, [eventIds[0], studentIds[0]]);

  const campaignSpecs = [
    ['Student Scholarship Fund', 'Support meritorious students with financial aid.', 500000],
    ['Lab Modernization', 'Upgrade computing laboratories for current batches.', 300000],
    ['Community Outreach', 'Fund social initiatives led by SIES students.', 150000]
  ];
  const campaignIds = [];
  for (const [title, description, target] of campaignSpecs) {
    const { rows } = await query(
      `INSERT INTO donation_campaigns (title, description, target_amount, collected_amount, start_date, end_date, status, created_by)
       VALUES ($1,$2,$3,0,CURRENT_DATE, CURRENT_DATE + INTERVAL '180 days','ACTIVE',$4) RETURNING id`,
      [title, description, target, adminId]
    );
    campaignIds.push(rows[0].id);
  }

  await query(
    `INSERT INTO connections (requester_id, addressee_id, status) VALUES ($1,$2,'ACCEPTED')`,
    [studentIds[0], alumniIds[0]]
  );
  await query(
    `INSERT INTO connections (requester_id, addressee_id, status) VALUES ($1,$2,'PENDING')`,
    [studentIds[1], alumniIds[0]]
  );
  await query(
    `INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1,$2,$3)`,
    [alumniIds[0], studentIds[0], 'Welcome to the alumni network. Happy to help with internships.']
  );
  await query(
    `INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1,$2,$3)`,
    [studentIds[0], alumniIds[0], 'Thank you! I would love resume feedback.']
  );

  await query(
    `INSERT INTO notifications (user_id, type, title, body, link) VALUES
     ($1,'WELCOME','Welcome to SIES Alumni Network','Explore the directory, jobs, and events.','/dashboard'),
     ($2,'WELCOME','Welcome alumni','Share opportunities and mentor students.','/dashboard'),
     ($3,'WELCOME','Admin workspace ready','Review pending alumni, jobs, and events.','/admin')`,
    [studentIds[0], alumniIds[0], adminId]
  );

  console.log('Seed complete.');
  console.log('Development/demo credentials (NOT for production):');
  console.log('  Admin   admin@siesgst.ac.in   DemoPass123!');
  console.log('  Alumni  alumni@siesgst.ac.in  DemoPass123!');
  console.log('  Student student@siesgst.ac.in DemoPass123!');
  await pool.end();
}

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
