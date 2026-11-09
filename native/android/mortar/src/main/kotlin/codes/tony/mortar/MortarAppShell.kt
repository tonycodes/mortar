package codes.tony.mortar

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

/** A top-level destination in a [MortarAppShell]. */
public data class MortarNavigationItem<T>(
    public val value: T,
    public val label: String,
    public val icon: ImageVector,
)

/**
 * An app's top-level navigation, as the web AppShell, following Android's
 * window size classes: a bottom navigation bar on phones (under 600dp), a
 * navigation rail on medium windows, and a sidebar from 840dp.
 *
 * @param content The screen for a destination.
 */
@Composable
public fun <T> MortarAppShell(
    brand: String,
    selected: T,
    onSelect: (T) -> Unit,
    items: List<MortarNavigationItem<T>>,
    modifier: Modifier = Modifier,
    content: @Composable (T) -> Unit,
) {
    val p = Mortar.palette
    BoxWithConstraints(modifier.fillMaxSize().background(mortarColour(p.paper))) {
        val screen = @Composable { Box(Modifier.fillMaxSize()) { content(selected) } }
        when {
            maxWidth < 600.dp -> Column(Modifier.fillMaxSize()) {
                Box(Modifier.weight(1f)) { screen() }
                Box(Modifier.fillMaxWidth().height(1.dp).background(mortarColour(p.line)))
                Row(
                    Modifier
                        .fillMaxWidth()
                        .background(mortarColour(p.surface))
                        .padding(vertical = 6.dp)
                        .selectableGroup(),
                ) {
                    for (item in items) {
                        Destination(item, item.value == selected, { onSelect(item.value) }, Modifier.weight(1f), stacked = true)
                    }
                }
            }
            maxWidth < 840.dp -> Row(Modifier.fillMaxSize()) {
                Column(
                    Modifier
                        .width(80.dp)
                        .fillMaxHeight()
                        .background(mortarColour(p.sunken))
                        .padding(vertical = 12.dp)
                        .selectableGroup(),
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    for (item in items) {
                        Destination(item, item.value == selected, { onSelect(item.value) }, Modifier.fillMaxWidth(), stacked = true)
                    }
                }
                Box(Modifier.width(1.dp).fillMaxHeight().background(mortarColour(p.line)))
                Box(Modifier.weight(1f)) { screen() }
            }
            else -> Row(Modifier.fillMaxSize()) {
                Column(
                    Modifier
                        .width(240.dp)
                        .fillMaxHeight()
                        .background(mortarColour(p.sunken))
                        .padding(12.dp)
                        .selectableGroup(),
                    verticalArrangement = Arrangement.spacedBy(2.dp),
                ) {
                    Text(
                        brand,
                        style = mortarText(15f, FontWeight.Bold, heading = true),
                        color = mortarColour(p.ink),
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 12.dp).semantics { heading() },
                    )
                    for (item in items) {
                        Destination(item, item.value == selected, { onSelect(item.value) }, Modifier.fillMaxWidth(), stacked = false)
                    }
                }
                Box(Modifier.width(1.dp).fillMaxHeight().background(mortarColour(p.line)))
                Box(Modifier.weight(1f)) { screen() }
            }
        }
    }
}

@Composable
private fun <T> Destination(
    item: MortarNavigationItem<T>,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier,
    stacked: Boolean,
) {
    val p = Mortar.palette
    val tint = mortarColour(if (isSelected) p.ink else p.secondary)
    val weight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal
    val shape = RoundedCornerShape(MortarTokens.radius.dp)
    val base = modifier
        .heightIn(min = TouchTarget)
        .selectable(isSelected, role = Role.Tab, onClick = onClick)
    if (stacked) {
        Column(base, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Box(
                Modifier
                    .size(width = 56.dp, height = 28.dp)
                    .background(if (isSelected) mortarColour(p.selected) else Color.Transparent, RoundedCornerShape(14.dp)),
                contentAlignment = Alignment.Center,
            ) { Icon(item.icon, null, tint = tint, modifier = Modifier.size(20.dp)) }
            Text(
                item.label,
                style = mortarText(11f, weight),
                color = tint,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    } else {
        Row(
            base
                .background(if (isSelected) mortarColour(p.selected) else Color.Transparent, shape)
                .padding(horizontal = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(item.icon, null, tint = tint, modifier = Modifier.size(18.dp))
            Text(item.label, style = mortarText(Mortar.brand.density.fontSize, weight), color = tint)
        }
    }
}
