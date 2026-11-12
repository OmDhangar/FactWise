'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { UserRole } from '@/types';
import { AppNavigation } from '@/components/layout/AppNavigation';
import { NurseDashboard } from '@/components/nurse/NurseDashboard';
import { DoctorDashboard } from '@/components/doctor/DoctorDashboard';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { FacilityOverview } from '@/components/facility/FacilityOverview';

export default function HomePage() {
  const { activeUser } = useStore();
  const [currentTab, setCurrentTab] = useState<UserRole>(activeUser.role);

  // Sync tab whenever evaluator clicks the top Demo Persona Switcher
  useEffect(() => {
    setCurrentTab(activeUser.role);
  }, [activeUser.role]);

  return (
    <div className="space-y-6">
      {/* Role Navigation Bar */}
      <AppNavigation
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
      />

      {/* Role-Specific View */}
      <div>
        {currentTab === 'nurse' && <NurseDashboard />}
        {currentTab === 'doctor' && <DoctorDashboard />}
        {currentTab === 'admin' && <AdminDashboard />}
        {currentTab === 'head_doctor' && <FacilityOverview />}
      </div>
    </div>
  );
}

