import { View, Text, StyleSheet } from 'react-native'
import { colors, formatBRL } from '@kickoffstore/ui'

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Kickoffstore</Text>
      <Text style={styles.subtitle}>Aplicativo do cliente — em construção (Fundação).</Text>
      <Text style={styles.hint}>Exemplo de tokens compartilhados: {formatBRL(49900)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.night[900],
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  brand: { color: colors.brand[400], fontSize: 34, fontWeight: '900' },
  subtitle: { color: '#e3e8ea', fontSize: 16, marginTop: 12, textAlign: 'center' },
  hint: { color: colors.night[500], fontSize: 13, marginTop: 24 },
})
