package codes.tony.mortar

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

/** What leads a [MortarListItem]: a person's avatar or an icon in a tile. */
public sealed interface MortarListLeading {
    public data class Avatar(public val name: String, public val image: Painter? = null) : MortarListLeading
    public data class Icon(public val icon: ImageVector) : MortarListLeading
}

/**
 * One row of a [MortarStackedList].
 *
 * @param trailing Short text at the end of the row, such as a date or a count.
 * @param onClick Makes the row clickable; with `chevrons`, it ends in a chevron.
 */
public data class MortarListItem(
    public val id: String,
    public val title: String,
    public val description: String? = null,
    public val leading: MortarListLeading? = null,
    public val trailing: String? = null,
    public val onClick: (() -> Unit)? = null,
)

/** A labelled group of rows in a [MortarStackedList]. */
public data class MortarListGroup(public val label: String, public val items: List<MortarListItem>)

/** A bordered list of people, files or records, as the web StackedList. */
@Composable
public fun MortarStackedList(
    items: List<MortarListItem>,
    modifier: Modifier = Modifier,
    title: String? = null,
    chevrons: Boolean = false,
) {
    StackedList(listOf(null to items), modifier, title, chevrons)
}

/** A bordered list of rows under group headings, as the web StackedList's `groups`. */
// Both overloads take a List, so the JVM needs a distinct name for this one.
@JvmName("MortarStackedListGroups")
@Composable
public fun MortarStackedList(
    groups: List<MortarListGroup>,
    modifier: Modifier = Modifier,
    title: String? = null,
    chevrons: Boolean = false,
) {
    StackedList(groups.map { it.label to it.items }, modifier, title, chevrons)
}

@Composable
private fun StackedList(
    groups: List<Pair<String?, List<MortarListItem>>>,
    modifier: Modifier,
    title: String?,
    chevrons: Boolean,
) {
    val p = Mortar.palette
    val shape = RoundedCornerShape(MortarTokens.radiusLg.dp)
    val rule = @Composable { Box(Modifier.fillMaxWidth().height(1.dp).background(mortarColour(p.line))) }
    Column(
        modifier
            .clip(shape)
            .background(mortarColour(p.surface))
            .border(1.dp, mortarColour(p.line), shape),
    ) {
        if (title != null) {
            Text(
                title,
                style = mortarText(15f, FontWeight.SemiBold, heading = true),
                color = mortarColour(p.ink),
                modifier = Modifier
                    .padding(horizontal = 18.dp, vertical = 14.dp)
                    .semantics { heading() },
            )
            rule()
        }
        groups.forEachIndexed { g, (label, items) ->
            if (label != null) {
                Text(
                    label,
                    style = mortarText(12f, FontWeight.SemiBold),
                    color = mortarColour(p.secondary),
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(mortarColour(p.sunken))
                        .padding(horizontal = 18.dp, vertical = 6.dp)
                        .semantics { heading() },
                )
                rule()
            }
            items.forEachIndexed { i, item ->
                ListRow(item, chevrons && item.onClick != null)
                if (i < items.size - 1 || g < groups.size - 1) rule()
            }
        }
    }
}

@Composable
private fun ListRow(item: MortarListItem, chevron: Boolean) {
    val p = Mortar.palette
    val density = Mortar.brand.density
    Row(
        Modifier
            .fillMaxWidth()
            .heightIn(min = TouchTarget)
            .then(if (item.onClick != null) Modifier.clickable(role = Role.Button, onClick = item.onClick) else Modifier)
            .padding(horizontal = 18.dp, vertical = density.rowPad.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        when (val leading = item.leading) {
            is MortarListLeading.Avatar -> MortarAvatar(leading.name, image = leading.image, decorative = true)
            is MortarListLeading.Icon -> Box(
                Modifier.size(34.dp).background(mortarColour(p.sunken), RoundedCornerShape(MortarTokens.radius.dp)),
                contentAlignment = Alignment.Center,
            ) { Icon(leading.icon, null, tint = mortarColour(p.secondary), modifier = Modifier.size(18.dp)) }
            null -> Unit
        }
        Column(Modifier.weight(1f)) {
            Text(item.title, style = mortarText(density.fontSize, FontWeight.SemiBold), color = mortarColour(p.ink))
            if (item.description != null) {
                Text(
                    item.description,
                    style = mortarText(12f),
                    color = mortarColour(p.muted),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
        if (item.trailing != null) Text(item.trailing, style = mortarText(12f), color = mortarColour(p.muted))
        if (chevron) {
            Icon(
                Icons.AutoMirrored.Filled.KeyboardArrowRight,
                null,
                tint = mortarColour(p.muted),
                modifier = Modifier.size(18.dp),
            )
        }
    }
}
