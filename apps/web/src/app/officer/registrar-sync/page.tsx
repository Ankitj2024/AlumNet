'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Upload,
  ArrowRight,
  Database,
  Building,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Breadcrumb } from '@/components/arc/breadcrumb/breadcrumb';
import { Button } from '@/components/arc/button/button';

export default function OfficerRegistrarSyncPage() {
  const [csvContent, setCsvContent] = useState(
    `institutionalAlumniId,legalFullName,graduationYear,academicDepartment,degreeAwarded,officialEmail
ALUM-2023-CS-101,David Miller,2023,Computer Science,B.Tech Computer Science,david.m@alumni.edu
ALUM-2022-EE-082,Priya Nair,2022,Electrical Engineering,B.Tech Electrical,priya.n@alumni.edu
ALUM-2021-ME-044,Marcus Vance,2021,Mechanical Engineering,B.Tech Mechanical,marcus.v@alumni.edu`
  );

  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);
    setResult(null);
    setErrorMessage(null);

    const res = await fetchApi<any>('/alumni/verification/import-registrar-csv', {
      method: 'POST',
      body: JSON.stringify({ csvContent }),
    });

    setImporting(false);

    if (res.success && res.data) {
      setResult(res.data);
    } else {
      setErrorMessage(res.error?.message || 'CSV batch import failed. Please check formatting.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          <Breadcrumb
            items={[
              { label: 'Campus' },
              { label: 'Advancement' },
              { label: 'Registrar Sync' },
            ]}
          />
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-2">
            Registrar Master Alumni Records Sync
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Synchronize official graduation records to enable instant automatic ERP verification for alumni mentors.
          </p>
        </div>

        <Link href="/officer/verifications">
          <Button variant="secondary" size="sm" className="rounded-full text-xs">
            &larr; View Verification Queue
          </Button>
        </Link>
      </div>

      {result && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold">Sync Completed Successfully!</div>
              <div className="text-[11px] text-emerald-700">
                Processed: {result.totalProcessed} records • Successfully Staged: {result.insertedCount || result.totalProcessed}
              </div>
            </div>
          </div>
          <Link href="/officer/verifications" className="font-semibold underline">
            Review Queue &rarr;
          </Link>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleImport} className="lg:col-span-2 apple-card p-6 bg-white border border-black/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Paste Registrar CSV Data
            </label>
            <span className="text-[10px] text-neutral-400">Comma-separated format</span>
          </div>

          <textarea
            required
            rows={10}
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            className="w-full text-xs font-mono p-3.5 rounded-xl border border-neutral-200 bg-[#fbfbfd] focus:outline-none focus:ring-1 focus:ring-black"
          />

          <div className="flex justify-between items-center pt-2">
            <span className="text-[11px] text-neutral-400">
              Duplicates by ID are updated automatically.
            </span>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={importing}
              className="rounded-full px-6 font-semibold text-xs"
            >
              <Upload className="w-3.5 h-3.5 mr-1" />
              {importing ? 'Processing CSV...' : 'Execute Registrar Sync'}
            </Button>
          </div>
        </form>

        <div className="apple-card p-6 bg-white border border-black/[0.06] space-y-4 text-xs">
          <div className="font-bold text-neutral-900 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-blue-600" />
            Expected CSV Column Format
          </div>

          <p className="text-neutral-500 leading-relaxed text-[11px]">
            The registrar CSV import must adhere to the standard institutional schema:
          </p>

          <div className="p-3 rounded-xl bg-[#f5f5f7] font-mono text-[10px] text-neutral-700 space-y-1">
            <div>1. institutionalAlumniId</div>
            <div>2. legalFullName</div>
            <div>3. graduationYear</div>
            <div>4. academicDepartment</div>
            <div>5. degreeAwarded</div>
            <div>6. officialEmail</div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-800 space-y-1">
            <div className="font-semibold">Automatic Matching:</div>
            <div>
              When an alumnus registers with an ID matching this list, they are verified immediately with zero manual review needed.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
