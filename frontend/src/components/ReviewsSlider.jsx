const reviews = [
  {
    name: 'Mohamed Elawady',
    rating: 5,
    comment: 'Awesome',
  },
  {
    name: 'Omar Ezzat',
    rating: 4,
    comment: "I love massive fresco but isn't spicy enough",
  },
  {
    name: 'Mohamed Gomaa',
    rating: 5,
    comment: 'Delivery — Place is great food is amazing',
  },
  {
    name: 'Julie Youannes',
    rating: 5,
    comment: 'Best fried chicken sandwiches ever!',
  },
  {
    name: 'George Safwat',
    rating: 4,
    comment: 'Very good',
  },
  {
    name: 'Ramez Kamel Habib',
    rating: 5,
    comment: 'Cool place to find smile and celebrity',
  },
  {
    name: 'John Nabih',
    rating: 5,
    comment: 'Great value for money',
  },
  {
    name: 'Dora Anwar',
    rating: 5,
    comment: 'Loved it',
  },
  {
    name: 'Marley Said',
    rating: 5,
    comment: 'So tasty 😋',
  },
  {
    name: 'Eng. Micheal Fawzy',
    rating: 5,
    comment: '❤️',
  },
  {
    name: 'Tony Ebrahem',
    rating: 4,
    comment: 'Good',
  },
  {
    name: 'Peter Ezzat',
    rating: 5,
    comment: 'Great food',
  },
  {
    name: 'Andrew Gamil',
    rating: 5,
    comment: 'The best fried chicken ever',
  },
  {
    name: 'Sherif Farouk',
    rating: 5,
    comment: 'The best 🤞',
  },
  {
    name: 'Marco Samy',
    rating: 5,
    comment: 'Excellent service, great food, respectable management, and very fast delivery',
  },
  {
    name: 'Ahmed El-Saeed',
    rating: 5,
    comment: 'Wonderful, excellent prices, fast delivery, very respectful staff',
  },
  {
    name: 'Sherief Elia',
    rating: 4,
    comment: 'The food is amazing and reasonably priced',
  },
  {
    name: 'Fady Hanna',
    rating: 4,
    comment: 'Very good food and service',
  },
  {
    name: 'Amr Essam',
    rating: 4,
    comment: 'Nice shop, improving over time',
  },
  {
    name: 'Hazaa Alhajri',
    rating: 5,
    comment: 'Known for innovative large sandwiches',
  },
  {
    name: 'Samir Mamdouh',
    rating: 5,
    comment: 'Excellent',
  },
  {
    name: 'Irini Matta',
    rating: 5,
    comment: 'Clean and beautiful place',
  },
  {
    name: 'Haide Khaled',
    rating: 5,
    comment: '💙💙',
  },
  {
    name: 'Y0y0 Samy',
    rating: 5,
    comment: 'Beautiful and delicious food',
  },
  {
    name: 'Aymen Anter',
    rating: 5,
    comment: 'One of my favorite places',
  },
  {
    name: 'Abanop Gamal',
    rating: 5,
    comment: 'Clean and delicious food',
  },
  {
    name: 'Ramy Naem',
    rating: 5,
    comment: 'Very very good sandwich + prices',
  },
];

function Stars({ n }) {
  return (
    <span className="inline-flex gap-0.5 text-[13px] leading-none md:text-sm" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <span key={i}>⭐</span>
      ))}
    </span>
  );
}

/** Two identical runs → CSS translate -50% loops forever with no seam. */
function ReviewCard({ review }) {
  return (
    <article
      className="flex h-full min-h-[200px] w-[min(78vw,17.5rem)] shrink-0 flex-col rounded-2xl border border-white/[0.12] bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-4 shadow-[0_12px_40px_-14px_rgba(0,0,0,0.75)] ring-1 ring-white/[0.06] sm:w-[18rem] md:min-h-[220px] md:w-[19rem] md:p-5"
    >
      <div className="mb-3 h-0.5 w-10 rounded-full bg-gradient-to-r from-brand-gold/80 to-brand-red/60" aria-hidden />
      <div className="mb-3 flex items-start justify-between gap-2">
        <Stars n={review.rating} />
      </div>
      <h3 className="font-display text-[15px] font-bold leading-snug text-white md:text-base">{review.name}</h3>
      <p className="mt-2 line-clamp-4 flex-1 text-[13px] leading-relaxed text-white/65 md:text-sm">{review.comment}</p>
      <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-3">
        <span className="rounded-md bg-emerald-500/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300/95 ring-1 ring-emerald-400/25 md:text-[11px]">
          ✓ Verified order
        </span>
      </div>
    </article>
  );
}

export default function ReviewsSlider() {
  const loop = [...reviews, ...reviews];

  return (
    <section
      className="group relative overflow-hidden border-y border-white/[0.08] bg-[#0f0700] py-8 md:py-12"
      aria-label="Customer reviews"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-[#0f0700] via-[#0f0700]/95 to-transparent md:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-[#0f0700] via-[#0f0700]/95 to-transparent md:w-24" />

      <div className="mb-6 px-4 text-center md:mb-8">
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-brand-gold md:text-sm">
          Customer reviews
        </p>
        <p className="mt-2 text-sm text-white/45">What diners are saying</p>
      </div>

      <div className="overflow-hidden" dir="ltr">
        <div className="review-ticker-track flex w-max items-stretch gap-4 px-1 md:gap-5">
          {loop.map((review, index) => (
            <ReviewCard key={`${review.name}-${index}`} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}
