import React, { useState } from "react";
import {
    AppBar,
    Button,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Toolbar,
    Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";

const CategoryListItem = ({category}) => {
    const [categoryName, setCategoryName] = useState(category.category);
    const [order, setOrder] = useState(category.order);

    return (
        <>
            <ListItem >
                <ListItemText primary={`${order}: ${categoryName}`} />
            </ListItem>
            <Divider />
        </>
    );
}

export default function Categories({ categories, setToggleCategoryView, }) {
    return (
        <>
            <AppBar sx={{ position: 'relative' }}>
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={() => setToggleCategoryView(false)}
                        aria-label="close"
                    >
                        <Close />
                    </IconButton>
                    <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                        Categories
                    </Typography>
                    <Button autoFocus color="inherit" onClick={() => setToggleCategoryView(false)}>
                        save
                    </Button>
                </Toolbar>
            </AppBar>
            <List>
                {categories.map(category => <CategoryListItem key={category.category} category={category} />)}
            </List>
        </>
    )
}
