import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/Reviews.css';

interface Review {
  _id: string;
  clientName: string;
  rating: number;
  comment: string;
  aspects: {
    punctuality: number;
    quality: number;
    communication: number;
    value: number;
  };
  date: string;
  serviceName: string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  aspectAverages: {
    punctuality: number;
    quality: number;
    communication: number;
    value: number;
  };
}

const Reviews: React.FC = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  useEffect(() => {
    fetchReviews();
  }, [providerId, sortBy]);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/reviews/provider/${providerId}?sort=${sortBy}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setStats(data.stats);
      } else {
        throw new Error('Errore nel caricamento delle recensioni');
      }
    } catch (err) {
      console.error('Errore:', err);
      setError('Errore nel caricamento delle recensioni');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: 'small' | 'medium' | 'large' = 'medium') => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span 
          key={i} 
          className={`star ${i <= rating ? 'active' : ''} ${size}`}
        >
          ⭐
        </span>
      );
    }
    return stars;
  };

  const renderRatingBar = (rating: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
      <div className="rating-bar-container">
        <span className="rating-number">{rating}</span>
        <div className="rating-stars-small">
          {renderStars(rating, 'small')}
        </div>
        <div className="rating-bar">
          <div 
            className="rating-bar-fill" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="rating-count">({count})</span>
      </div>
    );
  };

  const getAspectLabel = (aspect: string) => {
    switch (aspect) {
      case 'punctuality': return 'Puntualità';
      case 'quality': return 'Qualità';
      case 'communication': return 'Comunicazione';
      case 'value': return 'Rapporto Qualità/Prezzo';
      default: return aspect;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'oldest':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  if (loading) {
    return <div className="loading">Caricamento recensioni...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="reviews-page">
      <div className="reviews-header">
        <h1>Recensioni</h1>
        {stats && (
          <div className="reviews-summary">
            <div className="rating-summary">
              <div className="average-rating">
                <span className="rating-number-large">{stats.averageRating.toFixed(1)}</span>
                <div className="rating-stars-large">
                  {renderStars(Math.round(stats.averageRating), 'large')}
                </div>
                <span className="total-reviews">
                  Basato su {stats.totalReviews} recensioni
                </span>
              </div>
              
              <div className="rating-distribution">
                {[5, 4, 3, 2, 1].map(rating => (
                  <div key={rating}>
                    {renderRatingBar(
                      rating, 
                      stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution], 
                      stats.totalReviews
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="aspect-ratings">
              <h3>Valutazioni per Aspetto</h3>
              <div className="aspects-grid">
                {Object.entries(stats.aspectAverages).map(([aspect, average]) => (
                  <div key={aspect} className="aspect-summary">
                    <label>{getAspectLabel(aspect)}</label>
                    <div className="aspect-rating">
                      <span className="aspect-score">{average.toFixed(1)}</span>
                      <div className="aspect-stars">
                        {renderStars(Math.round(average), 'small')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="reviews-controls">
        <div className="sort-controls">
          <label htmlFor="sort">Ordina per:</label>
          <select 
            id="sort"
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="newest">Più Recenti</option>
            <option value="oldest">Più Vecchie</option>
            <option value="highest">Voto Più Alto</option>
            <option value="lowest">Voto Più Basso</option>
          </select>
        </div>
      </div>

      <div className="reviews-list">
        {sortedReviews.length === 0 ? (
          <div className="no-reviews">
            <h3>Nessuna recensione ancora</h3>
            <p>Questo fornitore non ha ancora ricevuto recensioni.</p>
          </div>
        ) : (
          sortedReviews.map((review) => (
            <div key={review._id} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  <div className="reviewer-name">{review.clientName}</div>
                  <div className="review-service">{review.serviceName}</div>
                </div>
                <div className="review-rating">
                  <div className="rating-stars">
                    {renderStars(review.rating)}
                  </div>
                  <div className="review-date">{formatDate(review.date)}</div>
                </div>
              </div>

              <div className="review-content">
                <p className="review-comment">{review.comment}</p>
                
                <div className="review-aspects">
                  {Object.entries(review.aspects).map(([aspect, rating]) => (
                    <div key={aspect} className="aspect-rating-item">
                      <span className="aspect-label">{getAspectLabel(aspect)}</span>
                      <div className="aspect-stars-small">
                        {renderStars(rating, 'small')}
                      </div>
                      <span className="aspect-score-small">{rating}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reviews;
