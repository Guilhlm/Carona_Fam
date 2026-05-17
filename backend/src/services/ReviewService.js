const HttpError = require('../utils/HttpError');

const MIN_RATING = 1;
const MAX_RATING = 5;
const MAX_COMMENT_LENGTH = 500;

class ReviewService {
  constructor({ reviewRepository, rideRepository }) {
    this.reviewRepository = reviewRepository;
    this.rideRepository = rideRepository;
  }

  async getReviewContext(rideId, currentUser) {
    const rideRecord = await this.rideRepository.findRideDetail(rideId);
    if (!rideRecord) throw HttpError.notFound('Corrida não encontrada');

    const isRequester = rideRecord.requesterId === currentUser.id;
    const isDriver = rideRecord.driverId === currentUser.id;
    if (!isRequester && !isDriver) throw HttpError.forbidden('Acesso negado');

    if (rideRecord.status !== 'COMPLETED') {
      return {
        ride: rideRecord,
        canReview: false,
        reason: 'Corrida ainda não foi concluída',
        mine: null,
        other: null,
        targetUser: null,
      };
    }

    const targetUser = isRequester ? rideRecord.driver : rideRecord.requester;
    if (!targetUser) {
      return {
        ride: rideRecord,
        canReview: false,
        reason: 'Nenhuma contraparte para avaliar',
        mine: null,
        other: null,
        targetUser: null,
      };
    }

    const reviewsForRide = await this.reviewRepository.findManyByRide(rideId);
    const myReview = reviewsForRide.find((reviewRecord) => reviewRecord.reviewerId === currentUser.id) ?? null;
    const reviewAboutMe = reviewsForRide.find((reviewRecord) => reviewRecord.reviewedId === currentUser.id) ?? null;

    return {
      ride: rideRecord,
      canReview: !myReview,
      reason: myReview ? 'Você já avaliou esta corrida' : null,
      mine: myReview,
      other: reviewAboutMe,
      targetUser,
    };
  }

  async createReview(rideId, currentUser, { rating, comment }) {
    const numericRating = parseInt(rating, 10);
    if (!Number.isInteger(numericRating) || numericRating < MIN_RATING || numericRating > MAX_RATING) {
      throw HttpError.badRequest(`Avaliação deve ser um número inteiro entre ${MIN_RATING} e ${MAX_RATING}`);
    }
    const trimmedComment =
      typeof comment === 'string' ? comment.trim().slice(0, MAX_COMMENT_LENGTH) : null;

    const rideRecord = await this.rideRepository.findRideDetail(rideId);
    if (!rideRecord) throw HttpError.notFound('Corrida não encontrada');
    if (rideRecord.status !== 'COMPLETED') {
      throw HttpError.badRequest('Só é possível avaliar corridas concluídas');
    }

    const isRequester = rideRecord.requesterId === currentUser.id;
    const isDriver = rideRecord.driverId === currentUser.id;
    if (!isRequester && !isDriver) throw HttpError.forbidden('Acesso negado');

    const reviewedUserId = isRequester ? rideRecord.driverId : rideRecord.requesterId;
    if (!reviewedUserId) throw HttpError.badRequest('Não há contraparte para avaliar nesta corrida');

    const existingReview = await this.reviewRepository.findByRideAndReviewer(rideId, currentUser.id);
    if (existingReview) throw HttpError.conflict('Você já avaliou esta corrida');

    return this.reviewRepository.create({
      rideId,
      reviewerId: currentUser.id,
      reviewedId: reviewedUserId,
      rating: numericRating,
      comment: trimmedComment || null,
    });
  }
}

module.exports = ReviewService;
