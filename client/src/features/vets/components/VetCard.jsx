import { Link } from 'react-router-dom';
import { getUser } from '../../auth/utils/auth';

const clinicCardImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDdl-oJEfmj1-MRfk26dXhdEwOPHvNxWxvGWAw_3HOXVQh-EWdwvJ1drwZCXP4g1LDG5foK05H416Rx1O5MsKJWeiVOsvZBK2F_WfD4dV__EFufD_uDotup1t9lhHkVFuFEXaipadGakirdStwd8LJB836QpHRfGxc025EBrCbErp4kb-GWLcMNNiQ-jEwtHHFh9K74YfM42UoATv7fsXisCWXwrhyaaD5hjkdPQ45z9W3ZFl7wZMy0ODsO0iH1VPTSPBfe6IohBX3w',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDUG56S8CvUDLXxhtwxTtgF_UywOOBOvPRJFnpBeOskbBXT0HdpM9_PEoyc3M8bczL8_CXx1gLoKlt2QnTqci5x5BVq2d6BwEhYZ1EBbe38WtShbbxQVX_wvcA01_ZV67O9KqEbtDpHu4lONg5SJfgJbm75On54bJvD4RFbaz_kVWTLqTIL6HZZajeiouT824LPCuBdSAbsoTzCNFLTW54uOTJLolb1plQSvmHvmEoRvvEMOtnrpCPoelvP0Cljn2nwQng3miafqma5',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDpngRHz0IvgMb1gKh4yhzjHJZJ4RiBxBJAsdzBOmRVB8-LCOUZc852F5mzHVOgOiE7sykv_I_0YouueWQxnzkJsAOf-qZc2jg45yHuySQSmwLMnX815KBj6CWhJhPEd0d-ZLcAHdJblEH2gjplsxwQ5PlyIwgHZjTwQ4ns0yM4b9UYuc3PQm0jpdSywICUV5kRgW1jOZ_zXGfKGJbpPX6ad1DvcmmJQQ5G0ti3108yahd8JelcWb_NB4AJrsVUGMUI3zY8LiIfoXoQ',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC7PFAX4G7Q_kgqiWj8A3l7wI6xGPoZWAg5hAq-lfYwCT2eXOfWzyP_l0e74cHNMB28pE4EddASBuv6sGk-lN_YTFzQFe0prHeAsW_zsT79v4Y2NwIctNvK8g1VnHjVj1RYV3WvsknnPmd8LkyvL0p0Ox59GxyF-7NX5McuYiJwLQFhW4H4BSt_YT3I5N1W_8T4wJrKlpE1jVfmrYYvK5j7BtVY3fAsTqleif7Kq4M0xVbYFvW7soMdLSH0PYBo9ABGR0eLxmwZL6g',
];

function VetCard({ vet, index = 0 }) {
  const currentUser = getUser();
  const clinic = vet?.clinic || vet || {};
  const services = clinic.servicesOffered || [];
  const ratingValue =
    typeof clinic.averageRating === 'number'
      ? clinic.averageRating
      : typeof clinic.rating === 'number'
        ? clinic.rating
        : 0;

  const clinicId = vet?._id || clinic?._id;
  const canBook = !currentUser || ['petOwner', 'admin'].includes(currentUser.role);
  const bookingTarget = currentUser ? `/vets/${clinicId}/book` : '/login';

  return (
    <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.1)]">
      <div className="relative">
        <img
          src={clinicCardImages[index % clinicCardImages.length]}
          alt={clinic.clinicName || 'Veterinary clinic'}
          className="h-56 w-full object-cover"
        />
        <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#002045] shadow">
          ⭐ {(ratingValue || 4.8).toFixed(1)}
        </div>
        <div
          className={`absolute bottom-4 left-4 rounded-full px-3 py-1 text-xs font-bold ${
            vet?.isCurrentlyOpen || clinic?.isOpenNow
              ? 'bg-emerald-700 text-white'
              : 'bg-slate-800 text-white'
          }`}
        >
          {vet?.isCurrentlyOpen || clinic?.isOpenNow ? 'Open now' : 'Closed now'}
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-display text-3xl font-bold leading-tight text-[#002045]">
          {clinic.clinicName || 'Unnamed Clinic'}
        </h3>
        <p className="mt-3 text-sm text-slate-600">
          {clinic.address || 'No address provided'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {clinic.contactNumber || 'No phone provided'}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {services.length > 0 ? (
            services.slice(0, 4).map((service, serviceIndex) => (
              <span
                key={`${clinic._id || index}-${serviceIndex}`}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
              >
                {service}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              No services listed
            </span>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Consultation</div>
            <div className="mt-2 text-2xl font-extrabold text-[#002045]">৳ {clinic.consultationFee ?? 'N/A'}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Working hours</div>
            <div className="mt-2 text-sm font-semibold text-slate-700">
              {clinic.workingHours?.openTime && clinic.workingHours?.closeTime
                ? `${clinic.workingHours.openTime} - ${clinic.workingHours.closeTime}`
                : 'Not provided'}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#002045] transition hover:border-slate-400 hover:bg-slate-50"
            to={`/vets/${clinicId}`}
          >
            View details
          </Link>

          {canBook && (
            <Link
              className="rounded-xl bg-[#002045] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1A365D]"
              to={bookingTarget}
              state={!currentUser ? { from: `/vets/${clinicId}/book` } : undefined}
            >
              Book appointment
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default VetCard;
