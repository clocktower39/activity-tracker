import React, { useState, useEffect } from "react";
import { useDispatch } from 'react-redux';
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
import { updateCategories } from '../../Redux/actions';

const CategoryItem = ({ category, setLocalCategories }) => {
    const [categoryName, setCategoryName] = useState(category.category);
    const [order, setOrder] = useState(category.order);

    const handleChange = async (e, setter) => {
        setter(e.target.value);
    }
    useEffect(()=>{
        setLocalCategories(prev => prev.map(prevCategory => {
            if(category._id === prevCategory._id){
                prevCategory.order = order;
                prevCategory.category = categoryName;
                console.log(prev)
            }
            return prevCategory;
        }))
    },[category._id, categoryName, order, setLocalCategories])

    return (
        <Grid container item xs={12} spacing={1} >
            <Grid container item xs={2}><TextField label="Order" value={order} onChange={(e) => handleChange(e, setOrder)} /></Grid>
            <Grid container item xs={10}><TextField label="Category" value={categoryName} fullWidth onChange={(e) => handleChange(e, setCategoryName)} /></Grid>
        </Grid>
    );
}

export default function Categories({ categoryId, categories, setToggleCategoryView, }) {
    const dispatch = useDispatch();
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newOrder, setNewOrder] = useState("");
    const [localCategories, setLocalCategories] = useState(categories);

    const handleChange = (e, setter) => setter(e.target.value);

    const handleAddCategory = () => {
        dispatch(updateCategories(
            [
                ...localCategories,
                { category: newCategoryName, order: newOrder, }
            ]))
    }

    const handleSaveCategories = () => {
        dispatch(updateCategories(
            [
                ...localCategories,
            ]))
    }

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
                        <Button autoFocus color="inherit" onClick={handleSaveCategories}>
                            save
                        </Button>
                    </Toolbar>
                </AppBar>
            </Grid>
            <Grid container item xs={12} spacing={1} sx={{ padding: '15px' }}>
                {localCategories.map(category => <CategoryItem key={category._id} category={category} setLocalCategories={setLocalCategories} />)}
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
                                        <IconButton onClick={handleAddCategory}>
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
