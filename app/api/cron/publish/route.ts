import { NextRequest, NextResponse } from 'next/server';
import { runSchedulerCheck } from '../../../../lib/scheduler';

export async function GET(request: NextRequest) {
  try {
    const result = await runSchedulerCheck();
    return NextResponse.json({
      success: true,
      message: 'Vercel Cron scheduler check completed',
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

export const dynamic = 'force-dynamic';
