import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { MaintenanceReport } from '../types/report';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#334155',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e40af',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#475569',
  },
  value: {
    fontSize: 10,
  },
  taskList: {
    marginTop: 5,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: '#2563eb',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
  },
  pluginsText: {
    fontSize: 10,
    lineHeight: 1.5,
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    textAlign: 'center',
    fontSize: 9,
    color: '#94a3b8',
  }
});

export const PDFTemplate = ({ data }: { data: MaintenanceReport }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Informe de Mantenimiento</Text>
          <Text style={styles.subtitle}>{data.reportMonth} {data.reportYear}</Text>
        </View>
        <Text style={{ fontSize: 10, color: '#2563eb' }}>{data.clientUrl}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumen General</Text>
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.value}>{data.clientName}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>Sitio Web</Text>
            <Text style={styles.value}>{data.clientUrl}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tareas Realizadas</Text>
        <View style={styles.taskList}>
          <View style={styles.taskItem}>
            <View style={[styles.checkbox, data.tasks.wpCore ? styles.checkboxChecked : {}]} />
            <Text>Actualización de WordPress Core</Text>
          </View>
          <View style={styles.taskItem}>
            <View style={[styles.checkbox, data.tasks.dbOptimization ? styles.checkboxChecked : {}]} />
            <Text>Optimización de Base de Datos</Text>
          </View>
          <View style={styles.taskItem}>
            <View style={[styles.checkbox, data.tasks.monthlyBackup ? styles.checkboxChecked : {}]} />
            <Text>Copia de Seguridad Mensual</Text>
          </View>
          <View style={styles.taskItem}>
            <View style={[styles.checkbox, data.tasks.securityReview ? styles.checkboxChecked : {}]} />
            <Text>Revisión de Seguridad</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rendimiento y SEO</Text>
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.label}>Velocidad de Carga</Text>
            <Text style={styles.value}>{data.performanceSpeed}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>Puntuación SEO</Text>
            <Text style={styles.value}>{data.performanceSeo}%</Text>
          </View>
        </View>
      </View>

      {data.updatedPlugins && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plugins Actualizados</Text>
          <Text style={styles.pluginsText}>{data.updatedPlugins}</Text>
        </View>
      )}

      <Text style={styles.footer}>
        Este informe fue generado automáticamente para {data.clientName}. 
        © {new Date().getFullYear()} Informe de Mantenimiento Web.
      </Text>
    </Page>
  </Document>
);
