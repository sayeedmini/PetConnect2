function AppointmentSlotPicker({ slots = [], selectedSlotId, onSelect, loading }) {
  if (loading) {
    return <p className="text-sm text-slate-500">Loading available slots...</p>;
  }

  if (slots.length === 0) {
    return <p className="text-sm text-slate-500">No slots available for this date.</p>;
  }

  return (
    <div
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      role="list"
      aria-label="Available appointment slots"
    >
      {slots.map((slot) => {
        const isActive = selectedSlotId === slot.id;

        return (
          <button
            key={slot.id}
            type="button"
            onClick={() => onSelect(slot)}
            className={[
              'rounded-2xl border px-4 py-3 text-left transition',
              isActive
                ? 'border-[#16b85b] bg-[#158E4A] text-[#002045] shadow-[0_14px_32px_rgba(33,222,115,0.25)]'
                : 'border-slate-300 bg-white text-slate-700 hover:border-[#158E4A] hover:bg-[#EFFFF5]',
            ].join(' ')}
            aria-pressed={isActive}
          >
            <div className="text-xl font-semibold">{slot.label}</div>

            <div
              className={`mt-1 text-xs font-medium ${
                isActive ? 'text-[#002045]' : 'text-slate-500'
              }`}
            >
              {isActive ? 'Selected slot' : 'Tap to choose'}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default AppointmentSlotPicker;