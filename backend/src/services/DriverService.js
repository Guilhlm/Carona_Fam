class DriverService {
  constructor({ driverRepository }) {
    this.driverRepository = driverRepository;
  }

  async listDrivers(filters = {}) {
    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [drivers, total] = await this.driverRepository.listActiveDrivers(skip, limit);

    return {
      data: drivers.map((driver) => ({
        id: driver.id,
        name: driver.name,
        email: driver.email,
        ra: driver.ra,
        vehicles: driver.vehiclesAsDriver,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDriverById(id) {
    const driver = await this.driverRepository.findDriverDetailsById(id);

    if (!driver) {
      const err = new Error('Motorista não encontrado');
      err.statusCode = 404;
      throw err;
    }

    const avgRating =
      driver.reviewsReceived.length > 0
        ? driver.reviewsReceived.reduce((sum, review) => sum + review.rating, 0) / driver.reviewsReceived.length
        : null;

    return {
      ...driver,
      averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    };
  }
}

module.exports = DriverService;
