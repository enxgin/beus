import { Customer, Appointment, Payment } from '@prisma/client';

export interface CustomerAnalytics {
  lifecycle: {
    registrationDate: Date;
    daysSinceRegistration: number;
    stage: 'new' | 'developing' | 'loyal' | 'vip';
    stageLabel: string;
    stageColor: string;
  };
  loyaltyScore: {
    score: number;
    level: string;
    breakdown: {
      frequency: number;
      spending: number;
      tenure: number;
      recency: number;
    };
  };
  appointmentPattern: {
    averageInterval: number;
    intervalUnit: string;
    consistency: number;
    totalAppointments: number;
  };
  favoriteServices: {
    top3: Array<{
      id: string;
      name: string;
      count: number;
      percentage: number;
    }>;
    totalServices: number;
  };
}

export function calculateDaysSince(date: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateLifecycleStage(customer: Customer & { payments?: Payment[] }): {
  stage: 'new' | 'developing' | 'loyal' | 'vip';
  stageLabel: string;
  stageColor: string;
} {
  const daysSince = calculateDaysSince(customer.createdAt);
  const totalSpent = customer.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  
  let stage: 'new' | 'developing' | 'loyal' | 'vip';
  let stageLabel: string;
  let stageColor: string;

  if (daysSince <= 90) {
    stage = 'new';
    stageLabel = 'Yeni Müşteri';
    stageColor = 'blue';
  } else if (daysSince <= 365) {
    stage = 'developing';
    stageLabel = 'Gelişen Müşteri';
    stageColor = 'orange';
  } else if (daysSince > 730 && totalSpent > 5000) {
    stage = 'vip';
    stageLabel = 'VIP Müşteri';
    stageColor = 'purple';
  } else {
    stage = 'loyal';
    stageLabel = 'Sadık Müşteri';
    stageColor = 'green';
  }

  return { stage, stageLabel, stageColor };
}

export function calculateFrequencyScore(appointments: Appointment[]): number {
  if (!appointments || appointments.length === 0) return 0;
  
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  
  const recentAppointments = appointments.filter(
    apt => new Date(apt.startTime) >= oneYearAgo
  );
  
  // 0-12 randevu arası 0-100 puan
  return Math.min(100, Math.round((recentAppointments.length / 12) * 100));
}

export function calculateSpendingScore(payments: Payment[]): number {
  if (!payments || payments.length === 0) return 0;
  
  const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);
  
  // 0-10000 TL arası 0-100 puan
  return Math.min(100, Math.round((totalSpent / 10000) * 100));
}

export function calculateTenureScore(registrationDate: Date): number {
  const daysSince = calculateDaysSince(registrationDate);
  
  // 0-1095 gün (3 yıl) arası 0-100 puan
  return Math.min(100, Math.round((daysSince / 1095) * 100));
}

export function calculateRecencyScore(appointments: Appointment[]): number {
  if (!appointments || appointments.length === 0) return 0;
  
  const sortedAppointments = appointments
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  
  const lastAppointment = sortedAppointments[0];
  const daysSinceLastAppointment = calculateDaysSince(new Date(lastAppointment.startTime));
  
  // Son 30 gün içinde 100 puan, her gün için -3.33 puan
  return Math.max(0, 100 - Math.round(daysSinceLastAppointment * 3.33));
}

export function calculateLoyaltyScore(
  customer: Customer & { 
    appointments?: Appointment[]; 
    payments?: Payment[] 
  }
): {
  score: number;
  level: string;
  breakdown: {
    frequency: number;
    spending: number;
    tenure: number;
    recency: number;
  };
} {
  const frequencyScore = calculateFrequencyScore(customer.appointments || []);
  const spendingScore = calculateSpendingScore(customer.payments || []);
  const tenureScore = calculateTenureScore(customer.createdAt);
  const recencyScore = calculateRecencyScore(customer.appointments || []);
  
  const totalScore = Math.round(
    frequencyScore * 0.4 +
    spendingScore * 0.3 +
    tenureScore * 0.2 +
    recencyScore * 0.1
  );

  let level: string;
  if (totalScore >= 80) level = 'Çok Yüksek';
  else if (totalScore >= 60) level = 'Yüksek';
  else if (totalScore >= 40) level = 'Orta';
  else if (totalScore >= 20) level = 'Düşük';
  else level = 'Çok Düşük';

  return {
    score: totalScore,
    level,
    breakdown: {
      frequency: frequencyScore,
      spending: spendingScore,
      tenure: tenureScore,
      recency: recencyScore,
    },
  };
}

export function calculateAverageInterval(appointments: Appointment[]): {
  averageInterval: number;
  intervalUnit: string;
  consistency: number;
} {
  if (!appointments || appointments.length < 2) {
    return { averageInterval: 0, intervalUnit: 'gün', consistency: 0 };
  }

  const sortedAppointments = appointments
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const intervals: number[] = [];
  for (let i = 1; i < sortedAppointments.length; i++) {
    const prevDate = new Date(sortedAppointments[i - 1].startTime);
    const currentDate = new Date(sortedAppointments[i].startTime);
    const diffDays = Math.abs(currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    intervals.push(diffDays);
  }

  const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  
  // Consistency: intervals arasındaki standart sapmanın tersi
  const mean = averageInterval;
  const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
  const standardDeviation = Math.sqrt(variance);
  const consistency = Math.max(0, 100 - (standardDeviation / mean) * 100);

  let intervalUnit = 'gün';
  let displayInterval = averageInterval;

  if (averageInterval >= 30) {
    intervalUnit = 'ay';
    displayInterval = averageInterval / 30;
  } else if (averageInterval >= 7) {
    intervalUnit = 'hafta';
    displayInterval = averageInterval / 7;
  }

  return {
    averageInterval: Math.round(displayInterval * 10) / 10,
    intervalUnit,
    consistency: Math.round(consistency),
  };
}

export function calculateFavoriteServices(
  appointments: (Appointment & { service?: { id: string; name: string } })[]
): {
  top3: Array<{
    id: string;
    name: string;
    count: number;
    percentage: number;
  }>;
  totalServices: number;
} {
  if (!appointments || appointments.length === 0) {
    return { top3: [], totalServices: 0 };
  }

  const serviceCount = new Map<string, { id: string; name: string; count: number }>();

  appointments.forEach(appointment => {
    if (appointment.service) {
      const serviceId = appointment.service.id;
      const serviceName = appointment.service.name;
      
      if (serviceCount.has(serviceId)) {
        serviceCount.get(serviceId)!.count++;
      } else {
        serviceCount.set(serviceId, { id: serviceId, name: serviceName, count: 1 });
      }
    }
  });

  const totalAppointments = appointments.length;
  const sortedServices = Array.from(serviceCount.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(service => ({
      ...service,
      percentage: Math.round((service.count / totalAppointments) * 100),
    }));

  return {
    top3: sortedServices,
    totalServices: serviceCount.size,
  };
}

export function calculateCustomerAnalytics(
  customer: Customer & {
    appointments?: (Appointment & { service?: { id: string; name: string } })[];
    payments?: Payment[];
  }
): CustomerAnalytics {
  const lifecycle = {
    registrationDate: customer.createdAt,
    daysSinceRegistration: calculateDaysSince(customer.createdAt),
    ...calculateLifecycleStage(customer),
  };

  const loyaltyScore = calculateLoyaltyScore(customer);
  
  const appointmentPattern = {
    ...calculateAverageInterval(customer.appointments || []),
    totalAppointments: customer.appointments?.length || 0,
  };

  const favoriteServices = calculateFavoriteServices(customer.appointments || []);

  return {
    lifecycle,
    loyaltyScore,
    appointmentPattern,
    favoriteServices,
  };
}