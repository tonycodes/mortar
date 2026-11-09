package codes.tony.mortar

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlin.math.roundToInt

/**
 * Progress towards a goal, with its label and value, as the web ProgressBar.
 *
 * @param valueLabel The value as people read it, such as "3 of 5 steps"; a percentage when null.
 * @param tone A status colour; the brand's primary when null.
 */
@Composable
public fun MortarProgressBar(
    label: String,
    value: Float,
    modifier: Modifier = Modifier,
    max: Float = 100f,
    valueLabel: String? = null,
    tone: MortarTone? = null,
) {
    val p = Mortar.palette
    val fraction = if (max > 0f) (value / max).coerceIn(0f, 1f) else 0f
    val text = valueLabel ?: "${(fraction * 100).roundToInt()}%"
    val shape = RoundedCornerShape(6.dp)
    Column(
        modifier.clearAndSetSemantics {
            contentDescription = label
            stateDescription = text
            progressBarRangeInfo = ProgressBarRangeInfo(fraction, 0f..1f)
        },
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, style = mortarText(12f, FontWeight.SemiBold), color = mortarColour(p.ink))
            Text(text, style = mortarText(12f).copy(fontFamily = FontFamily.Monospace), color = mortarColour(p.muted))
        }
        Box(Modifier.fillMaxWidth().height(6.dp).background(mortarColour(p.sunken), shape)) {
            Box(
                Modifier
                    .fillMaxWidth(fraction)
                    .fillMaxHeight()
                    .background(tone?.colour(p) ?: mortarColour(p.primary), shape),
            )
        }
    }
}
