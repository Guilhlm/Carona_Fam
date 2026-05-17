const reviewService = require('../services/review');
const { success, created } = require('../utils/response');

class ReviewController {
  constructor(service) {
    this.service = service;
  }

  getContext = async (req, res, next) => {
    try {
      const context = await this.service.getReviewContext(req.params.rideId, req.user);
      return success(res, {
        canReview: context.canReview,
        reason: context.reason,
        mine: context.mine,
        other: context.other,
        target: context.targetUser
          ? {
              id: context.targetUser.id,
              name: context.targetUser.name,
              photoUrl: context.targetUser.photoUrl ?? null,
              role: context.ride.requesterId === req.user.id ? 'DRIVER' : 'PASSENGER',
            }
          : null,
      });
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const { rating, comment } = req.body || {};
      const review = await this.service.createReview(req.params.rideId, req.user, { rating, comment });
      return created(res, review);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new ReviewController(reviewService);
