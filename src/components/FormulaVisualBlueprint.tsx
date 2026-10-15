import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { Colors } from '../theme/colors';

export type VisualBlueprintType =
  | 'secant_tangent'
  | 'triangle_centers'
  | 'common_tangents'
  | 'ci_tree_3yr'
  | 'alligation_cross'
  | 'power_ladder'
  | 'none';

interface Props {
  type?: VisualBlueprintType;
  width?: number;
  height?: number;
}

export default function FormulaVisualBlueprint({
  type = 'none',
  width = 280,
  height = 110,
}: Props) {
  if (!type || type === 'none') return null;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height} viewBox="0 0 280 110">
        {type === 'secant_tangent' && (
          <G>
            {/* Circle */}
            <Circle cx={190} cy={55} r={38} stroke="#4B5563" strokeWidth={2.5} fill="#FFFFFF" fillOpacity={0.6} />
            
            {/* External Point P */}
            <Circle cx={35} cy={55} r={4.5} fill="#1CB0F6" />
            <SvgText x={22} y={58} fill="#1CB0F6" fontSize={13} fontWeight="bold">P</SvgText>

            {/* Tangent Line PT */}
            <Line x1={35} y1={55} x2={190} y2={17} stroke="#58CC02" strokeWidth={3} strokeLinecap="round" />
            <Circle cx={190} cy={17} r={4.5} fill="#58CC02" />
            <SvgText x={192} y={13} fill="#58CC02" fontSize={12} fontWeight="bold">T (Tangent)</SvgText>

            {/* Secant Line PAB */}
            <Line x1={35} y1={55} x2={228} y2={55} stroke="#FF9600" strokeWidth={2.5} strokeLinecap="round" strokeDasharray="4 2" />
            
            {/* Point A */}
            <Circle cx={152} cy={55} r={4} fill="#FF9600" />
            <SvgText x={148} y={72} fill="#FF9600" fontSize={12} fontWeight="bold">A</SvgText>

            {/* Point B */}
            <Circle cx={228} cy={55} r={4} fill="#FF9600" />
            <SvgText x={226} y={72} fill="#FF9600" fontSize={12} fontWeight="bold">B</SvgText>

            {/* Equation Badge */}
            <Rect x={40} y={84} width={200} height={22} rx={6} fill="#E8F9DB" stroke="#58CC02" strokeWidth={1} />
            <SvgText x={140} y={99} textAnchor="middle" fill="#2E7D32" fontSize={11.5} fontWeight="bold">
              PT² = PA × PB (Whole Secant)
            </SvgText>
          </G>
        )}

        {type === 'triangle_centers' && (
          <G>
            {/* Triangle ABC */}
            <Polygon points="140,14 60,82 220,82" stroke="#4B5563" strokeWidth={2.5} fill="#FFFFFF" fillOpacity={0.7} />
            <SvgText x={140} y={11} textAnchor="middle" fill="#4B5563" fontSize={12} fontWeight="bold">A</SvgText>
            <SvgText x={48} y={88} fill="#4B5563" fontSize={12} fontWeight="bold">B</SvgText>
            <SvgText x={224} y={88} fill="#4B5563" fontSize={12} fontWeight="bold">C</SvgText>

            {/* Angle Bisectors to Incenter I */}
            <Line x1={60} y1={82} x2={140} y2={55} stroke="#58CC02" strokeWidth={2} strokeDasharray="3 2" />
            <Line x1={220} y1={82} x2={140} y2={55} stroke="#58CC02" strokeWidth={2} strokeDasharray="3 2" />

            {/* Incenter Dot */}
            <Circle cx={140} cy={55} r={4.5} fill="#58CC02" />
            <SvgText x={148} y={53} fill="#58CC02" fontSize={12} fontWeight="bold">I</SvgText>

            {/* Formula Badge */}
            <Rect x={40} y={88} width={200} height={20} rx={5} fill="#EFF6FF" stroke="#1CB0F6" strokeWidth={1} />
            <SvgText x={140} y={102} textAnchor="middle" fill="#1D4ED8" fontSize={11} fontWeight="bold">
              ∠BIC = 90° + ∠A / 2
            </SvgText>
          </G>
        )}

        {type === 'common_tangents' && (
          <G>
            {/* Circle 1 (Radius R) */}
            <Circle cx={65} cy={55} r={32} stroke="#1CB0F6" strokeWidth={2.5} fill="#FFFFFF" fillOpacity={0.6} />
            <Circle cx={65} cy={55} r={3} fill="#1CB0F6" />
            <Line x1={65} y1={55} x2={65} y2={23} stroke="#1CB0F6" strokeWidth={1.5} />
            <SvgText x={70} y={42} fill="#1CB0F6" fontSize={11} fontWeight="bold">R</SvgText>

            {/* Circle 2 (Radius r) */}
            <Circle cx={215} cy={55} r={22} stroke="#FF9600" strokeWidth={2.5} fill="#FFFFFF" fillOpacity={0.6} />
            <Circle cx={215} cy={55} r={3} fill="#FF9600" />
            <Line x1={215} y1={55} x2={215} y2={33} stroke="#FF9600" strokeWidth={1.5} />
            <SvgText x={218} y={46} fill="#FF9600" fontSize={11} fontWeight="bold">r</SvgText>

            {/* Direct Tangent (Top) */}
            <Line x1={65} y1={23} x2={215} y2={33} stroke="#58CC02" strokeWidth={2.5} strokeLinecap="round" />
            <SvgText x={140} y={22} textAnchor="middle" fill="#2E7D32" fontSize={10.5} fontWeight="bold">
              DCT = √[d² - (R-r)²]
            </SvgText>

            {/* Transverse Tangent (Cross) */}
            <Line x1={65} y1={23} x2={215} y2={77} stroke="#FF4B4B" strokeWidth={2} strokeDasharray="3 2" />
            
            {/* Center Distance Line d */}
            <Line x1={65} y1={55} x2={215} y2={55} stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="2 2" />
            <SvgText x={140} y={52} textAnchor="middle" fill="#6B7280" fontSize={10} fontWeight="bold">d (centers)</SvgText>

            {/* Transverse Tangent Formula */}
            <Rect x={35} y={88} width={210} height={19} rx={5} fill="#FFF4E5" stroke="#FF9600" strokeWidth={1} />
            <SvgText x={140} y={101} textAnchor="middle" fill="#C2410C" fontSize={10.5} fontWeight="bold">
              TCT = √[d² - (R+r)²] • Touching: 2√(Rr)
            </SvgText>
          </G>
        )}

        {type === 'ci_tree_3yr' && (
          <G>
            {/* Principal Box */}
            <Rect x={110} y={6} width={60} height={20} rx={4} fill="#1CB0F6" />
            <SvgText x={140} y={20} textAnchor="middle" fill="#FFFFFF" fontSize={10.5} fontWeight="bold">
              P = n³
            </SvgText>

            {/* Lines to Year 1, 2, 3 SI branches */}
            <Line x1={120} y1={26} x2={50} y2={42} stroke="#9CA3AF" strokeWidth={1.5} />
            <Line x1={140} y1={26} x2={140} y2={42} stroke="#9CA3AF" strokeWidth={1.5} />
            <Line x1={160} y1={26} x2={230} y2={42} stroke="#9CA3AF" strokeWidth={1.5} />

            {/* 3 SI blocks (n²) */}
            <Rect x={25} y={42} width={50} height={18} rx={3} fill="#E5E7EB" />
            <SvgText x={50} y={55} textAnchor="middle" fill="#374151" fontSize={10} fontWeight="bold">n² (SI)</SvgText>

            <Rect x={115} y={42} width={50} height={18} rx={3} fill="#E5E7EB" />
            <SvgText x={140} y={55} textAnchor="middle" fill="#374151" fontSize={10} fontWeight="bold">n² (SI)</SvgText>

            <Rect x={205} y={42} width={50} height={18} rx={3} fill="#E5E7EB" />
            <SvgText x={230} y={55} textAnchor="middle" fill="#374151" fontSize={10} fontWeight="bold">n² (SI)</SvgText>

            {/* CI Difference Blocks (3n + 1) highlighted in Gold */}
            <Rect x={70} y={66} width={42} height={16} rx={3} fill="#FEF08A" stroke="#EAB308" strokeWidth={1} />
            <SvgText x={91} y={78} textAnchor="middle" fill="#854D0E" fontSize={9.5} fontWeight="bold">n</SvgText>

            <Rect x={120} y={66} width={42} height={16} rx={3} fill="#FEF08A" stroke="#EAB308" strokeWidth={1} />
            <SvgText x={141} y={78} textAnchor="middle" fill="#854D0E" fontSize={9.5} fontWeight="bold">n</SvgText>

            <Rect x={170} y={66} width={42} height={16} rx={3} fill="#FEF08A" stroke="#EAB308" strokeWidth={1} />
            <SvgText x={191} y={78} textAnchor="middle" fill="#854D0E" fontSize={9.5} fontWeight="bold">n</SvgText>

            <Rect x={220} y={66} width={34} height={16} rx={3} fill="#FFD700" stroke="#CA8A04" strokeWidth={1.5} />
            <SvgText x={237} y={78} textAnchor="middle" fill="#713F12" fontSize={10} fontWeight="bold">1</SvgText>

            {/* Golden Key text */}
            <Rect x={40} y={88} width={200} height={19} rx={5} fill="#FEF9C3" stroke="#F59E0B" strokeWidth={1} />
            <SvgText x={140} y={101} textAnchor="middle" fill="#92400E" fontSize={10.5} fontWeight="bold">
              3-Year (CI - SI) = 3n + 1  |  Principal = n³
            </SvgText>
          </G>
        )}

        {type === 'alligation_cross' && (
          <G>
            {/* Cross Lines */}
            <Line x1={65} y1={25} x2={215} y2={75} stroke="#9CA3AF" strokeWidth={2} />
            <Line x1={215} y1={25} x2={65} y2={75} stroke="#9CA3AF" strokeWidth={2} />

            {/* Top Left: Cheap Price C */}
            <Rect x={40} y={10} width={50} height={22} rx={4} fill="#EFF6FF" stroke="#1CB0F6" strokeWidth={1.5} />
            <SvgText x={65} y={25} textAnchor="middle" fill="#1D4ED8" fontSize={11} fontWeight="bold">Cheap (C)</SvgText>

            {/* Top Right: Dear Price D */}
            <Rect x={190} y={10} width={50} height={22} rx={4} fill="#FEF2F2" stroke="#FF4B4B" strokeWidth={1.5} />
            <SvgText x={215} y={25} textAnchor="middle" fill="#DC2626" fontSize={11} fontWeight="bold">Dear (D)</SvgText>

            {/* Center Mean Price M */}
            <Circle cx={140} cy={50} r={16} fill="#58CC02" />
            <SvgText x={140} y={54} textAnchor="middle" fill="#FFFFFF" fontSize={11.5} fontWeight="bold">M</SvgText>

            {/* Bottom Left Ratio: (D - M) */}
            <Rect x={35} y={72} width={60} height={20} rx={4} fill="#FEF3C7" stroke="#F59E0B" strokeWidth={1} />
            <SvgText x={65} y={86} textAnchor="middle" fill="#B45309" fontSize={10.5} fontWeight="bold">|D - M|</SvgText>

            {/* Colon */}
            <SvgText x={140} y={86} textAnchor="middle" fill="#1F2937" fontSize={14} fontWeight="bold">:</SvgText>

            {/* Bottom Right Ratio: (M - C) */}
            <Rect x={185} y={72} width={60} height={20} rx={4} fill="#FEF3C7" stroke="#F59E0B" strokeWidth={1} />
            <SvgText x={215} y={86} textAnchor="middle" fill="#B45309" fontSize={10.5} fontWeight="bold">|M - C|</SvgText>

            {/* Footer */}
            <SvgText x={140} y={103} textAnchor="middle" fill="#4B5563" fontSize={10} fontWeight="bold">
              Ratio of Quantities = (D - M) : (M - C)
            </SvgText>
          </G>
        )}

        {type === 'power_ladder' && (
          <G>
            {/* Step 1: Base k */}
            <Rect x={15} y={35} width={65} height={32} rx={6} fill="#E0F2FE" stroke="#0284C7" strokeWidth={1.5} />
            <SvgText x={47} y={49} textAnchor="middle" fill="#0369A1" fontSize={10} fontWeight="bold">x + 1/x</SvgText>
            <SvgText x={47} y={61} textAnchor="middle" fill="#0284C7" fontSize={11} fontWeight="bold">= k</SvgText>

            {/* Step 1 -> 2 Arrow */}
            <Line x1={80} y1={51} x2={100} y2={51} stroke="#58CC02" strokeWidth={2.5} strokeLinecap="round" />
            <Polygon points="104,51 98,47 98,55" fill="#58CC02" />
            <SvgText x={92} y={42} textAnchor="middle" fill="#15803D" fontSize={9.5} fontWeight="bold">k²-2</SvgText>

            {/* Step 2: Power 2 */}
            <Rect x={106} y={35} width={70} height={32} rx={6} fill="#DCFCE7" stroke="#16A34A" strokeWidth={1.5} />
            <SvgText x={141} y={49} textAnchor="middle" fill="#15803D" fontSize={10} fontWeight="bold">x² + 1/x²</SvgText>
            <SvgText x={141} y={61} textAnchor="middle" fill="#16A34A" fontSize={10.5} fontWeight="bold">k² - 2</SvgText>

            {/* Step 2 -> 3 Arrow */}
            <Line x1={176} y1={51} x2={196} y2={51} stroke="#CE82FF" strokeWidth={2.5} strokeLinecap="round" />
            <Polygon points="200,51 194,47 194,55" fill="#CE82FF" />
            <SvgText x={188} y={42} textAnchor="middle" fill="#7E22CE" fontSize={9.5} fontWeight="bold">k³-3k</SvgText>

            {/* Step 3: Power 3 */}
            <Rect x={202} y={35} width={70} height={32} rx={6} fill="#F3E8FF" stroke="#9333EA" strokeWidth={1.5} />
            <SvgText x={237} y={49} textAnchor="middle" fill="#7E22CE" fontSize={10} fontWeight="bold">x³ + 1/x³</SvgText>
            <SvgText x={237} y={61} textAnchor="middle" fill="#9333EA" fontSize={10.5} fontWeight="bold">k³ - 3k</SvgText>

            {/* Bottom summary */}
            <Rect x={30} y={82} width={220} height={22} rx={5} fill="#FEF3C7" stroke="#F59E0B" strokeWidth={1} />
            <SvgText x={140} y={97} textAnchor="middle" fill="#92400E" fontSize={10} fontWeight="bold">
              k=3 ➔ 7, 18  |  k=4 ➔ 14, 52  |  k=5 ➔ 23, 110
            </SvgText>
          </G>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderWidth: 1.5,
    borderColor: '#D7FFB8',
  },
});
