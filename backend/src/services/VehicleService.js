const { prisma } = require('../config/database');

async function getMyVehicle(driverId) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { driverId },
    orderBy: { createdAt: 'asc' },
  });

  return vehicle || null;
}

async function upsertMyVehicle(driverId, data) {
  const existing = await prisma.vehicle.findFirst({
    where: { driverId },
  });

  const payload = {};

  if (typeof data.brand !== 'undefined') {
    payload.brand = data.brand || null;
  }

  if (typeof data.model !== 'undefined') {
    payload.model = data.model || null;
  }

  if (typeof data.plate !== 'undefined') {
    payload.plate = data.plate;
  }

  if (typeof data.year !== 'undefined') {
    payload.year =
      data.year === null || data.year === '' || Number.isNaN(Number(data.year))
        ? null
        : parseInt(data.year, 10);
  }

  if (typeof data.capacityTotal !== 'undefined') {
    const capacityNumber = parseInt(data.capacityTotal, 10);
    payload.capacityTotal = Number.isNaN(capacityNumber) ? 4 : capacityNumber;
  }

  if (typeof data.photoUrl !== 'undefined') {
    payload.photoUrl = data.photoUrl || null;
  }

  if (existing) {
    const updated = await prisma.vehicle.update({
      where: { id: existing.id },
      data: payload,
    });
    return updated;
  }

  const created = await prisma.vehicle.create({
    data: {
      driverId,
      brand: payload.brand || null,
      model: payload.model || null,
      plate: payload.plate,
      year: typeof payload.year === 'number' ? payload.year : null,
      capacityTotal:
        typeof payload.capacityTotal === 'number' ? payload.capacityTotal : 4,
      photoUrl: payload.photoUrl || null,
    },
  });

  return created;
}

module.exports = {
  getMyVehicle,
  upsertMyVehicle,
};