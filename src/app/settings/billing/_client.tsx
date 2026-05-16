"use client";

import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/* Facturación — placeholder simple.
 * No planes, no trial, no renovaciones, no facturas. La integración de
 * pagos llegará en una fase posterior. */

export function BillingClient() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card>
        <CardContent className="px-6 py-14 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#B8EB23]/10 ring-1 ring-[#B8EB23]/20 flex items-center justify-center text-[#B8EB23] mb-4">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="text-[15px] font-semibold text-white tracking-tight">
            Facturación próximamente
          </h3>
          <p className="text-[13px] text-white/45 leading-relaxed max-w-sm mt-2">
            La integración de pagos y facturación llegará en una próxima
            actualización. Por ahora no hay cargos asociados a tu cuenta.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
