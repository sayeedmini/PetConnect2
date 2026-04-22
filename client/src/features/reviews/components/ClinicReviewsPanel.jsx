import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createClinicReview,
  getClinicReviews,
  getMyClinicReview,
  moderateReview,
  updateReview,
} from '../services/reviewApi';
import { getUser, isLoggedIn } from '../../auth/utils/auth';

function ClinicReviewsPanel({ clinicId, onReviewStatsChange }) {
  const user = getUser();
  const loggedIn = isLoggedIn();
  const isAdmin = user?.role === 'admin';
  const canWriteReview = ['petOwner', 'admin'].includes(user?.role);

  const [reviews, setReviews] = useState([]);
  const [myReviewData, setMyReviewData] = useState({
    review: null,
    canReview: false,
    reason: '',
  });
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ rating: 5, comment: '' });
  const [moderationDrafts, setModerationDrafts] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await getClinicReviews(clinicId, isAdmin);
      setReviews(response.data || []);
    } catch (error) {
      console.error(error);
    }
  }, [clinicId, isAdmin]);

  const fetchMyReview = useCallback(async () => {
    if (!loggedIn || !canWriteReview) {
      setMyReviewData({ review: null, canReview: false, reason: '' });
      return;
    }

    try {
      const response = await getMyClinicReview(clinicId);
      const payload = response.data || { review: null, canReview: false, reason: '' };
      setMyReviewData(payload);

      if (payload.review) {
        setFormData({
          rating: payload.review.rating,
          comment: payload.review.comment || '',
        });
      } else {
        setFormData({ rating: 5, comment: '' });
      }
    } catch (error) {
      console.error(error);
    }
  }, [canWriteReview, clinicId, loggedIn]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchReviews(), fetchMyReview()]);
      setLoading(false);
    };

    loadAll();
  }, [fetchMyReview, fetchReviews]);

  const approvedReviews = useMemo(
    () => reviews.filter((review) => review.moderationStatus === 'approved'),
    [reviews]
  );

  useEffect(() => {
    if (typeof onReviewStatsChange !== 'function') {
      return;
    }

    const totalReviews = approvedReviews.length;
    const rating = totalReviews
      ? Number(
          (
            approvedReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
            totalReviews
          ).toFixed(1)
        )
      : 0;

    onReviewStatsChange({ rating, totalReviews });
  }, [approvedReviews, onReviewStatsChange]);

  const handleFormChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (myReviewData.review?._id) {
        await updateReview(myReviewData.review._id, formData);
        alert('Review updated successfully');
      } else {
        await createClinicReview(clinicId, formData);
        alert('Review submitted successfully');
      }

      await Promise.all([fetchReviews(), fetchMyReview()]);
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to save review');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const getModerationDraft = (review) => {
    return (
      moderationDrafts[review._id] || {
        moderationStatus: review.moderationStatus,
        adminNote: review.adminNote || '',
      }
    );
  };

  const setModerationDraft = (reviewId, field, value) => {
    setModerationDrafts((prev) => ({
      ...prev,
      [reviewId]: {
        ...(prev[reviewId] || {}),
        [field]: value,
      },
    }));
  };

  const handleModerationSave = async (review) => {
    const payload = getModerationDraft(review);

    try {
      await moderateReview(review._id, payload);
      alert('Review moderation updated');
      await fetchReviews();
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to moderate review');
      console.error(error);
    }
  };

  return (
    <section style={styles.wrapper}>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={{ marginBottom: 6 }}>Clinic Reviews</h2>
          <p style={styles.subtleText}>
            Verified pet owners can submit one review per clinic after a completed appointment.
          </p>
        </div>
        <div style={styles.statChip}>{approvedReviews.length} approved review(s)</div>
      </div>

      {loading ? (
        <p>Loading reviews...</p>
      ) : (
        <>
          {canWriteReview && loggedIn && (
            <div style={styles.formCard}>
              <h3 style={{ marginTop: 0 }}>
                {myReviewData.review ? 'Edit Your Review' : 'Write a Review'}
              </h3>

              {!myReviewData.review && !myReviewData.canReview && myReviewData.reason && (
                <p style={styles.warningText}>{myReviewData.reason}</p>
              )}

              {(myReviewData.review || myReviewData.canReview) && (
                <form onSubmit={handleSubmit} style={styles.formGrid}>
                  <label>
                    Rating
                    <select
                      name="rating"
                      value={formData.rating}
                      onChange={handleFormChange}
                      required
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} Star{value > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Review Comment
                    <textarea
                      name="comment"
                      rows="4"
                      placeholder="Share your appointment experience, communication, and service quality"
                      value={formData.comment}
                      onChange={handleFormChange}
                    />
                  </label>

                  <button type="submit" disabled={submitting}>
                    {submitting
                      ? 'Saving review...'
                      : myReviewData.review
                        ? 'Update Review'
                        : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          )}

          {reviews.length === 0 ? (
            <p>No reviews yet.</p>
          ) : (
            <div style={styles.reviewList}>
              {reviews.map((review) => {
                const draft = getModerationDraft(review);

                return (
                  <div key={review._id} style={styles.reviewCard}>
                    <div style={styles.reviewHeader}>
                      <div>
                        <h4 style={{ margin: 0 }}>{review.reviewer?.name || 'Anonymous user'}</h4>
                        <p style={styles.subtleText}>
                          {new Date(review.createdAt).toLocaleString()} · {review.rating}/5 rating
                        </p>
                      </div>
                      <span
                        style={{
                          ...styles.statusBadge,
                          background:
                            review.moderationStatus === 'approved' ? '#dcfce7' : '#fee2e2',
                          color: review.moderationStatus === 'approved' ? '#166534' : '#991b1b',
                        }}
                      >
                        {review.moderationStatus}
                      </span>
                    </div>

                    <p style={{ marginTop: 12 }}>
                      {review.comment || 'No written comment provided.'}
                    </p>

                    {review.adminNote && (
                      <p style={styles.adminNote}>
                        <strong>Admin note:</strong> {review.adminNote}
                      </p>
                    )}

                    {isAdmin && (
                      <div style={styles.adminPanel}>
                        <label>
                          Moderation Status
                          <select
                            value={draft.moderationStatus}
                            onChange={(e) =>
                              setModerationDraft(review._id, 'moderationStatus', e.target.value)
                            }
                          >
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </label>

                        <label>
                          Admin Note
                          <textarea
                            rows="3"
                            value={draft.adminNote}
                            onChange={(e) =>
                              setModerationDraft(review._id, 'adminNote', e.target.value)
                            }
                          />
                        </label>

                        <button type="button" onClick={() => handleModerationSave(review)}>
                          Save Moderation
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

const styles = {
  wrapper: {
    marginTop: '28px',
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
    marginBottom: '18px',
  },
  statChip: {
    background: '#eef2ff',
    color: '#3730a3',
    padding: '10px 14px',
    borderRadius: '999px',
    fontWeight: 600,
  },
  subtleText: {
    margin: 0,
    color: '#475569',
  },
  formCard: {
    background: '#f8fafc',
    borderRadius: '14px',
    padding: '18px',
    marginBottom: '18px',
  },
  formGrid: {
    display: 'grid',
    gap: '12px',
  },
  warningText: {
    color: '#b45309',
  },
  reviewList: {
    display: 'grid',
    gap: '16px',
  },
  reviewCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '18px',
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    flexWrap: 'wrap',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '999px',
    textTransform: 'capitalize',
    fontWeight: 700,
    fontSize: '0.88rem',
  },
  adminNote: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '12px',
  },
  adminPanel: {
    display: 'grid',
    gap: '10px',
    marginTop: '14px',
    paddingTop: '14px',
    borderTop: '1px solid #e2e8f0',
  },
};

export default ClinicReviewsPanel;