import { Link } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';

export default function HomePage() {
  return (
    <PublicLayout>
      <section className="bg-maroon-800 px-4 py-20 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-gold-400">SIES Graduate School of Technology</p>
          <h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">Alumni Network Portal</h1>
          <p className="mt-5 max-w-2xl text-lg text-maroon-50">
            A verified campus platform for students and alumni to connect, mentor, share opportunities, attend events, and
            support scholarships.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="rounded-lg bg-gold-500 px-5 py-2 font-semibold text-maroon-900">
              Join the network
            </Link>
            <Link to="/login" className="rounded-lg border border-white/40 px-5 py-2">
              Member login
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-12 md:grid-cols-3">
        {[
          ['Directory & Mentorship', 'Find classmates, alumni, and mentors by branch, batch, and skills.'],
          ['Jobs & Events', 'Apply to internships, RSVP to campus events, and stay involved.'],
          ['Giving', 'Support scholarships and campus funds with verified sandbox donations.']
        ].map(([title, text]) => (
          <article key={title} className="rounded-2xl bg-white p-6 shadow-card">
            <h2 className="font-display text-xl text-maroon-800">{title}</h2>
            <p className="mt-2 text-slate-600">{text}</p>
          </article>
        ))}
      </section>
    </PublicLayout>
  );
}
