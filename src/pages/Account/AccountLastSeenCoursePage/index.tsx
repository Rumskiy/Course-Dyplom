import {Avatar, Box, Button, Container, Divider, Grid, List, ListItem, ListItemText} from "@mui/material";

export const AccountLastSeenCourse = () => {
    return (
        <Container maxWidth="lg" sx={{mt: 12}}>
            <Grid container spacing={4}>
                {/* Sidebar - Profile & Links */}
                <Grid item xs={12} md={4}>
                    <Box sx={{p: 3, boxShadow: 3, borderRadius: 2}}>
                        {/* Profile Picture */}
                        <Box sx={{textAlign: 'center'}}>
                            <Avatar
                                src="src/assets/5494.jpg"
                                alt="Profile"
                                sx={{width: 150, height: 150, mx: 'auto', mb: 2}}
                            />
                        </Box>
                        {/* Account Links */}
                        <List>
                            <ListItem  component="a" href="/account/settings">
                                <ListItemText primary="⚙️ Account Settings"/>
                            </ListItem>
                            <Divider/>
                            <ListItem  component="a" href="/account/courses">
                                <ListItemText primary="📚 Your Courses"/>
                            </ListItem>
                            <Divider/>
                            <ListItem  component="a" href="/account/blogs">
                                <ListItemText primary="📝 Your Blogs"/>
                            </ListItem>
                            <Divider/>
                            <ListItem>
                                <Button variant="outlined" color="error" fullWidth>
                                    Logout
                                </Button>
                            </ListItem>
                        </List>
                    </Box>
                </Grid>
                <Grid>
                    <Box>

                    </Box>
                </Grid>
            </Grid>
        </Container>
    );
};