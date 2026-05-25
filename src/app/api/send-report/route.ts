import { NextRequest, NextResponse } from 'next/server';
import { MaintenancePlugin, Client, SendReportPayload } from '@/types';
import { generateProfessionalEmailHtml } from '@/lib/email-template';

interface SendReportRequest {
  client: Client;
  monthYear: string;
  plugins: MaintenancePlugin[];
  wpVersion: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendReportRequest = await request.json();
    const { client, monthYear, plugins, wpVersion, notes } = body;

    if (!client || !plugins) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    const updatedPlugins = plugins.filter((p) => p.isUpdatedThisMonth && p.status === 'active');
    const reviewedPlugins = plugins.filter((p) => !p.isUpdatedThisMonth && p.status === 'active');

    const emailHtml = generateProfessionalEmailHtml(client, monthYear, plugins, wpVersion, notes);

    console.log('📧 Informe listo para enviar:');
    console.log('   Cliente:', client.nombre);
    console.log('   Mes:', monthYear);
    console.log('   Plugins actualizados:', updatedPlugins.length);
    console.log('   Plugins revisados:', reviewedPlugins.length);
    console.log('   Tamaño HTML:', emailHtml.length, 'bytes');

    return NextResponse.json({
      success: true,
      data: {
        sentAt: new Date().toISOString(),
        clientId: client.id,
        updatedCount: updatedPlugins.length,
        totalCount: plugins.filter((p) => p.status === 'active').length,
      },
      message: 'Informe generado y almacenado correctamente',
    });

  } catch (error) {
    console.error('Error al generar informe:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno al generar el informe' },
      { status: 500 }
    );
  }
}
