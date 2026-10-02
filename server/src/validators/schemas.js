const { z } = require('zod');

const email = z.string().trim().email('Enter a valid email address').toLowerCase();
const password = z.string().min(8, 'Password must be at least 8 characters');

const registerSchema = z.object({
  body: z.object({
    email,
    password,
    full_name: z.string().trim().min(2).max(200),
    role: z.enum(['STUDENT', 'ALUMNI']),
    phone: z.string().trim().max(30).optional().or(z.literal('')),
    branch: z.string().trim().max(120).optional().or(z.literal('')),
    batch_year: z.coerce.number().int().min(1980).max(2100).optional().nullable(),
    graduation_year: z.coerce.number().int().min(1980).max(2100).optional().nullable(),
    city: z.string().trim().max(120).optional().or(z.literal(''))
  })
});

const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string().min(1, 'Password is required')
  })
});

const forgotSchema = z.object({
  body: z.object({ email })
});

const resetSchema = z.object({
  body: z.object({
    token: z.string().min(10),
    password
  })
});

const profileSchema = z.object({
  body: z.object({
    full_name: z.string().trim().min(2).max(200).optional(),
    profile_photo: z.string().url().optional().or(z.literal('')).or(z.null()),
    phone: z.string().trim().max(30).optional().or(z.literal('')),
    branch: z.string().trim().max(120).optional().or(z.literal('')),
    batch_year: z.coerce.number().int().min(1980).max(2100).optional().nullable(),
    graduation_year: z.coerce.number().int().min(1980).max(2100).optional().nullable(),
    company: z.string().trim().max(200).optional().or(z.literal('')),
    job_title: z.string().trim().max(200).optional().or(z.literal('')),
    city: z.string().trim().max(120).optional().or(z.literal('')),
    bio: z.string().max(2000).optional().or(z.literal('')),
    skills: z.union([z.array(z.string()), z.string()]).optional(),
    linkedin_url: z.string().url().optional().or(z.literal('')),
    github_url: z.string().url().optional().or(z.literal('')),
    is_mentor: z.boolean().optional()
  })
});

const jobSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(200),
    company: z.string().trim().min(2).max(200),
    description: z.string().trim().min(20),
    location: z.string().trim().max(200).optional().or(z.literal('')),
    job_type: z.enum(['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT']),
    experience_required: z.string().trim().max(80).optional().or(z.literal('')),
    skills: z.union([z.array(z.string()), z.string()]).optional(),
    application_url: z.string().url().optional().or(z.literal('')),
    deadline: z.string().optional().nullable()
  })
});

const applySchema = z.object({
  body: z.object({
    resume_url: z.string().url('Enter a valid resume URL'),
    cover_letter: z.string().trim().min(20, 'Cover letter must be at least 20 characters')
  })
});

const eventSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().min(20),
    location: z.string().trim().min(2).max(255),
    event_date: z.string().min(1),
    capacity: z.coerce.number().int().min(1).max(10000)
  })
});

const donationOrderSchema = z.object({
  body: z.object({
    campaign_id: z.string().uuid(),
    amount: z.coerce.number().positive().min(1)
  })
});

const donationVerifySchema = z.object({
  body: z.object({
    donation_id: z.string().uuid(),
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1)
  })
});

const connectionSchema = z.object({
  body: z.object({
    addressee_id: z.string().uuid()
  })
});

const idParam = z.object({
  params: z.object({ id: z.string().uuid() })
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
  profileSchema,
  jobSchema,
  applySchema,
  eventSchema,
  donationOrderSchema,
  donationVerifySchema,
  connectionSchema,
  idParam
};
