import React, { useState } from "react";
import {
    AppBar,
    Button,
    Divider,
    IconButton,
    Grid,
    TextField,
    Toolbar,
    Typography,
    InputAdornment,
} from "@mui/material";
import { AddCircle, Close, } from "@mui/icons-material";

const CategoryItem = ({ category }) => {
    const [categoryName, setCategoryName] = useState(category.category);
    const [order, setOrder] = useState(category.order);

    const handleChange = (e, setter) => setter(e.target.value);

    return (
        <Grid container item xs={12} spacing={1} >
            <Grid container item xs={2}><TextField label="Order" value={order} onChange={(e) => handleChange(e, setOrder)}/></Grid>
            <Grid container item xs={10}><TextField label="Category" value={categoryName} fullWidth onChange={(e) => handleChange(e, setCategoryName)}/></Grid>
        </Grid>
    );
}

export default function Categories({ categories, setToggleCategoryView, }) {
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newOrder, setNewOrder] = useState("");

    const handleChange = (e, setter) => setter(e.target.value);

    return (
        <Grid container sx={{ backgroundColor: '#303030', }}>
            <Grid container item xs={12}>
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
            </Grid>
            <Grid container item xs={12} spacing={1} sx={{ padding: '15px' }}>
                {categories.map(category => <CategoryItem key={category.category} category={category} />)}
                <Grid container item xs={12} spacing={1} >
                    <Grid container item xs={12}><Divider /></Grid>
                    <Grid container item xs={2}><TextField label="Order" value={newOrder} onChange={(e) => handleChange(e, setNewOrder)} /></Grid>
                    <Grid container item xs={10}>
                        <TextField
                            label="Category"
                            value={newCategoryName}
                            fullWidth
                            onChange={(e) => handleChange(e, setNewCategoryName)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={null}>
                                            <AddCircle />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    )
}
