package codes.tony.mortar

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

/**
 * A small set of views or filters to switch between, as the web
 * SegmentedControl. Scrolls sideways when the segments do not fit.
 */
@Composable
public fun <T> MortarSegmentedControl(
    label: String,
    selected: T,
    onSelect: (T) -> Unit,
    options: List<Pair<T, String>>,
    modifier: Modifier = Modifier,
) {
    val p = Mortar.palette
    val segment = RoundedCornerShape(6.dp)
    Row(
        modifier
            .horizontalScroll(rememberScrollState())
            .background(mortarColour(p.sunken), RoundedCornerShape(MortarTokens.radius.dp))
            .padding(3.dp)
            .selectableGroup()
            .semantics { contentDescription = label },
        horizontalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        for ((value, text) in options) {
            val isSelected = value == selected
            Box(
                Modifier
                    .heightIn(min = TouchTarget - 6.dp)
                    .background(if (isSelected) mortarColour(p.surface) else Color.Transparent, segment)
                    .border(1.dp, if (isSelected) mortarColour(p.line) else Color.Transparent, segment)
                    .selectable(isSelected, role = Role.Tab) { onSelect(value) }
                    .padding(horizontal = 10.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text,
                    style = mortarText(12f, FontWeight.Medium),
                    color = mortarColour(if (isSelected) p.ink else p.muted),
                    maxLines = 1,
                )
            }
        }
    }
}
