package codes.tony.mortar

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/** The space a [MortarDivider] keeps above and below. */
public enum class MortarDividerSpacing { None, Sm, Md, Lg }

/**
 * A rule between groups of content, optionally with a label in the middle.
 *
 * @param soft The quieter line colour, for dividers inside cards.
 */
@Composable
public fun MortarDivider(
    modifier: Modifier = Modifier,
    label: String? = null,
    soft: Boolean = false,
    spacing: MortarDividerSpacing = MortarDividerSpacing.Md,
) {
    val p = Mortar.palette
    val colour = mortarColour(if (soft) p.line else p.lineStrong)
    val gap = when (spacing) {
        MortarDividerSpacing.None -> 0.dp
        MortarDividerSpacing.Sm -> 12.dp
        MortarDividerSpacing.Md -> 24.dp
        MortarDividerSpacing.Lg -> 40.dp
    }
    if (label == null) {
        Box(modifier.padding(vertical = gap).fillMaxWidth().height(1.dp).background(colour))
    } else {
        Row(
            modifier.padding(vertical = gap).fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(Modifier.weight(1f).height(1.dp).background(colour))
            Text(label, style = mortarText(13f), color = mortarColour(p.muted))
            Box(Modifier.weight(1f).height(1.dp).background(colour))
        }
    }
}
